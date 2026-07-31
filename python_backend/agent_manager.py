import os
import json
import asyncio
import time
from typing import Dict, List, Optional, Callable
from key_vault import key_vault
from memory_store import memory_store
from llm_clients import call_llm

LAYOUT_FILE = os.path.join(os.path.dirname(__file__), "data", "office_layout.json")

class AgentManager:
    def __init__(self):
        self.agents: Dict[str, dict] = {}
        self.cubicles: List[dict] = []
        self.decorations: List[dict] = []
        self.tileSize: int = 32
        self.cols: int = 24
        self.rows: int = 16
        self.logs: Dict[str, List[dict]] = {}
        self.broadcast_callback: Optional[Callable] = None
        self.load_layout()

    def set_broadcast_callback(self, cb: Callable):
        self.broadcast_callback = cb

    async def broadcast(self, event: str, payload: dict):
        if self.broadcast_callback:
            await self.broadcast_callback({"event": event, "data": payload})

    def load_layout(self):
        if os.path.exists(LAYOUT_FILE):
            try:
                with open(LAYOUT_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.cols = data.get("cols", 24)
                self.rows = data.get("rows", 16)
                self.tileSize = data.get("tileSize", 32)
                self.cubicles = data.get("cubicles", [])
                self.decorations = data.get("decorations", [])

                for a in data.get("agents", []):
                    aid = a["id"]
                    self.agents[aid] = {
                        **a,
                        "targetX": a["x"],
                        "targetY": a["y"],
                        "direction": a.get("direction", "down"),
                        "path": []
                    }
                    self.logs[aid] = []
            except Exception as e:
                print(f"[AgentManager Python] Layout load error: {e}")

    def add_log(self, agent_id: str, log_type: str, text: str):
        if agent_id not in self.logs:
            self.logs[agent_id] = []

        log_item = {
            "id": f"log_{int(time.time()*1000)}",
            "timestamp": time.strftime("%H:%M:%S"),
            "type": log_type,
            "text": text
        }
        self.logs[agent_id].append(log_item)
        if len(self.logs[agent_id]) > 200:
            self.logs[agent_id].pop(0)

        asyncio.create_task(self.broadcast("AGENT_LOG", {"agentId": agent_id, "log": log_item}))

    async def update_agent_status(self, agent_id: str, status: str, speech_bubble: Optional[str] = None, current_task: Optional[str] = None):
        agent = self.agents.get(agent_id)
        if not agent:
            return

        agent["status"] = status
        if speech_bubble is not None:
            agent["speechBubble"] = speech_bubble
        if current_task is not None:
            agent["currentTask"] = current_task

        await self.broadcast("AGENT_UPDATE", {
            "id": agent_id,
            "status": agent["status"],
            "speechBubble": agent["speechBubble"],
            "currentTask": agent["currentTask"],
            "x": agent["x"],
            "y": agent["y"],
            "direction": agent.get("direction", "down")
        })

    async def move_agent_to(self, agent_id: str, target_x: int, target_y: int):
        agent = self.agents.get(agent_id)
        if not agent:
            return

        cur_x, cur_y = agent["x"], agent["y"]
        while cur_x != target_x or cur_y != target_y:
            if cur_x < target_x: cur_x += 1; agent["direction"] = "right"
            elif cur_x > target_x: cur_x -= 1; agent["direction"] = "left"
            elif cur_y < target_y: cur_y += 1; agent["direction"] = "down"
            elif cur_y > target_y: cur_y -= 1; agent["direction"] = "up"

            agent["x"] = cur_x
            agent["y"] = cur_y
            await self.broadcast("AGENT_UPDATE", {
                "id": agent_id,
                "x": agent["x"],
                "y": agent["y"],
                "direction": agent["direction"],
                "status": agent["status"]
            })
            await asyncio.sleep(0.25)

    async def dispatch_task(self, agent_id: str, task_prompt: str) -> dict:
        agent = self.agents.get(agent_id)
        if not agent:
            return {"error": "Agent not found"}

        key_info = key_vault.get_agent_key(agent_id)
        key_name = key_info.get("name") if key_info else "Default Fallback"
        provider = key_info.get("provider", "openai") if key_info else "openai"

        self.add_log(agent_id, "INFO", f'🚀 Task received: "{task_prompt}"')
        self.add_log(agent_id, "KEY", f"🔑 Using Key: [{key_name}] ({provider.upper()})")

        # Phase 1: THINKING
        await self.update_agent_status(agent_id, "THINKING", "💡 Thinking...", task_prompt)
        await self.move_agent_to(agent_id, agent["deskX"], agent["deskY"])
        self.add_log(agent_id, "THOUGHT", f"Analyzing task with {provider.upper()} model...")
        await asyncio.sleep(1.5)

        # Phase 2: CODING
        await self.update_agent_status(agent_id, "CODING", "⌨️ Coding...", task_prompt)
        self.add_log(agent_id, "INFO", "Generating implementation solution...")

        llm_res = await call_llm(agent_id, task_prompt, agent["role"])

        self.add_log(agent_id, "CODE", llm_res["response"])
        self.add_log(agent_id, "INFO", f"Tokens: {llm_res['promptTokens']} prompt / {llm_res['completionTokens']} completion.")
        await asyncio.sleep(1.8)

        # Phase 3: EXECUTING
        if any(w in task_prompt.lower() for w in ["server", "deploy", "backend"]):
            await self.update_agent_status(agent_id, "EXECUTING", "⚡ Executing...", f"Deploying: {task_prompt}")
            self.add_log(agent_id, "EXEC", "Running deployment verification check...")
            await asyncio.sleep(2.0)
            self.add_log(agent_id, "EXEC", "Container build & WebSocket broadcast active.")

        await self.move_agent_to(agent_id, agent["deskX"], agent["deskY"])
        await self.update_agent_status(agent_id, "COMPLETED", "✅ Complete!", f"Finished: {task_prompt}")
        self.add_log(agent_id, "INFO", "Task completed successfully!")

        memory_store.append_task(agent_id, {
            "prompt": task_prompt,
            "response": llm_res["response"],
            "provider": llm_res["provider"],
            "keyMasked": llm_res["keyMasked"],
            "isRealAPI": llm_res["isRealAPI"]
        })

        async def _reset():
            await asyncio.sleep(5.0)
            if agent["status"] == "COMPLETED":
                await self.update_agent_status(agent_id, "IDLE", None, agent["currentTask"])

        asyncio.create_task(_reset())

        return {
            "success": True,
            "agentId": agent_id,
            "result": llm_res["response"],
            "telemetry": {
                "provider": llm_res["provider"],
                "keyMasked": llm_res["keyMasked"],
                "isRealAPI": llm_res["isRealAPI"]
            }
        }

    async def dispatch_team_workflow(self, project_prompt: str):
        await self.broadcast("WORKFLOW_START", {"prompt": project_prompt})

        await self.dispatch_task("agent_alex", f"Architect Spec: {project_prompt}")
        await asyncio.sleep(1.0)

        t1 = asyncio.create_task(self.dispatch_task("agent_maya", f"Frontend Interface: {project_prompt}"))
        t2 = asyncio.create_task(self.dispatch_task("agent_devon", f"Backend API: {project_prompt}"))
        await asyncio.gather(t1, t2)
        await asyncio.sleep(1.0)

        await self.dispatch_task("agent_sam", f"Audit & Security: {project_prompt}")
        await self.dispatch_task("agent_riley", f"Deploy Pipeline: {project_prompt}")

        await self.broadcast("WORKFLOW_COMPLETE", {"prompt": project_prompt})

    def get_all_state(self) -> dict:
        agents_list = []
        for a in self.agents.values():
            bound_key = key_vault.get_agent_key(a["id"])
            agents_list.append({
                **a,
                "assignedKey": {
                    "id": bound_key["keyId"],
                    "name": bound_key["name"],
                    "provider": bound_key["provider"],
                    "masked": bound_key["masked"],
                    "telemetry": bound_key.get("telemetry", {})
                } if bound_key else None
            })

        return {
            "cols": self.cols,
            "rows": self.rows,
            "tileSize": self.tileSize,
            "cubicles": self.cubicles,
            "decorations": self.decorations,
            "agents": agents_list,
            "keys": key_vault.get_all_keys()
        }

    def get_agent_logs(self, agent_id: str) -> List[dict]:
        return self.logs.get(agent_id, [])

agent_manager = AgentManager()
