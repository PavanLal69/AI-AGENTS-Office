import sys
import os
import uuid
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Pixel Office AI Agents Mission Gateway", version="2.0.0")

# In-Memory Mission Store & Event Bus
missions_db: Dict[str, Dict[str, Any]] = {}
memory_bus_logs: List[Dict[str, Any]] = []

class MissionRequest(BaseModel):
    prompt: str

class MissionResponse(BaseModel):
    mission_id: str
    status: str
    prompt: str
    created_at: float
    dag_tasks: List[Dict[str, Any]]

class MemoryEvent(BaseModel):
    mission_id: str
    agent_id: str
    event_type: str
    data: Dict[str, Any]

@app.get("/")
def read_root():
    return {
        "service": "Pixel Office AI Agents Enterprise Gateway",
        "status": "ONLINE",
        "active_missions": len(missions_db),
        "docs": "/docs"
    }

@app.post("/mission", response_model=MissionResponse)
def create_mission(request: MissionRequest):
    """
    Step 1: User Sends Prompt -> Create Structured Mission & DAG Task Graph
    """
    mission_id = f"mission_{uuid.uuid4().hex[:8]}"
    created_at = time.time()
    
    # Planner Agent DAG Task Graph
    dag_tasks = [
        {"id": "task_1", "name": "Architecture & Security Planning", "assigned_agent": "agent_alex", "status": "PENDING"},
        {"id": "task_2", "name": "Workspace Research & Feasibility Audit", "assigned_agent": "agent_sam", "status": "PENDING"},
        {"id": "task_3", "name": "Data Engine & Schema Design", "assigned_agent": "agent_marcus", "status": "PENDING"},
        {"id": "task_4", "name": "Core Backend & REST Handlers", "assigned_agent": "agent_devon", "status": "PENDING"},
        {"id": "task_5", "name": "Glassmorphic Frontend UI & Responsive Layout", "assigned_agent": "agent_maya", "status": "PENDING"},
        {"id": "task_6", "name": "Reviewer Code Audit & Security Check", "assigned_agent": "agent_elena", "status": "PENDING"},
        {"id": "task_7", "name": "DevOps Container Build & Port 3005 Deployment", "assigned_agent": "agent_riley", "status": "PENDING"}
    ]

    mission_record = {
        "mission_id": mission_id,
        "prompt": request.prompt,
        "status": "PLANNING",
        "created_at": created_at,
        "dag_tasks": dag_tasks,
        "memory_bus": [],
        "preview_url": "http://localhost:3005"
    }
    
    missions_db[mission_id] = mission_record

    # Publish Event to Memory Bus
    event = {
        "mission_id": mission_id,
        "agent_id": "agent_alex",
        "event_type": "MISSION_CREATED",
        "timestamp": created_at,
        "data": {"prompt": request.prompt}
    }
    memory_bus_logs.append(event)
    mission_record["memory_bus"].append(event)

    return MissionResponse(
        mission_id=mission_id,
        status=mission_record["status"],
        prompt=mission_record["prompt"],
        created_at=mission_record["created_at"],
        dag_tasks=mission_record["dag_tasks"]
    )

@app.get("/mission/{mission_id}")
def get_mission(mission_id: str):
    """
    Step 2: Query Mission Status & Shared Memory Bus
    """
    if mission_id not in missions_db:
        raise HTTPException(status_code=404, detail="Mission not found")
    return missions_db[mission_id]

@app.post("/memory/event")
def publish_memory_event(event: MemoryEvent):
    """
    Publish Memory Bus Event (Read/Write Blackboard Pattern)
    """
    evt_dict = event.dict()
    evt_dict["timestamp"] = time.time()
    memory_bus_logs.append(evt_dict)
    
    if event.mission_id in missions_db:
        missions_db[event.mission_id]["memory_bus"].append(evt_dict)
        
    return {"status": "SUCCESS", "event_id": len(memory_bus_logs)}

@app.get("/memory/bus")
def get_memory_bus():
    """
    Get full Memory Bus Event log
    """
    return {"total_events": len(memory_bus_logs), "events": memory_bus_logs[-20:]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
