import os
import json
import time
from typing import Dict, Any

MEMORY_DIR = os.path.join(os.path.dirname(__file__), "data", "agent_memory")

class MemoryStore:
    def __init__(self):
        self._ensure_dir()

    def _ensure_dir(self):
        if not os.path.exists(MEMORY_DIR):
            os.makedirs(MEMORY_DIR, exist_ok=True)

    def _get_path(self, agent_id: str) -> str:
        return os.path.join(MEMORY_DIR, f"{agent_id}_memory.json")

    def load_memory(self, agent_id: str) -> Dict[str, Any]:
        path = self._get_path(agent_id)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "agentId": agent_id,
            "created": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tasksCount": 0,
            "history": []
        }

    def save_memory(self, agent_id: str, memory_data: Dict[str, Any]) -> bool:
        path = self._get_path(agent_id)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(memory_data, f, indent=2)
            return True
        except Exception:
            return False

    def append_task(self, agent_id: str, task_record: Dict[str, Any]) -> Dict[str, Any]:
        mem = self.load_memory(agent_id)
        mem["tasksCount"] = mem.get("tasksCount", 0) + 1
        mem["lastUpdated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        if "history" not in mem:
            mem["history"] = []

        task_entry = {
            "id": f"task_{int(time.time() * 1000)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            **task_record
        }
        mem["history"].append(task_entry)
        if len(mem["history"]) > 50:
            mem["history"].pop(0)

        self.save_memory(agent_id, mem)
        return mem

memory_store = MemoryStore()
