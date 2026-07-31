import os
import subprocess
from typing import Dict, Any

WORKSPACE_ROOT = os.getcwd()

class WorkspaceTools:
    def __init__(self):
        self.workspace_root = WORKSPACE_ROOT

    def list_files(self, dir_path: str = "") -> Dict[str, Any]:
        target = os.path.join(self.workspace_root, dir_path)
        try:
            if not os.path.exists(target):
                return {"error": f"Path not found: {dir_path}"}
            
            items = []
            for entry in os.scandir(target):
                items.append({
                    "name": entry.name,
                    "isDirectory": entry.is_dir(),
                    "size": entry.stat().st_size if entry.is_file() else None
                })
            return {"path": dir_path or "/", "items": items}
        except Exception as e:
            return {"error": str(e)}

    def read_file(self, file_path: str) -> Dict[str, Any]:
        target = os.path.join(self.workspace_root, file_path)
        try:
            if not os.path.exists(target):
                return {"error": f"File not found: {file_path}"}
            with open(target, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(10000)
            return {"filePath": file_path, "content": content}
        except Exception as e:
            return {"error": str(e)}

    def write_file(self, file_path: str, content: str) -> Dict[str, Any]:
        target = os.path.join(self.workspace_root, file_path)
        try:
            parent = os.path.dirname(target)
            if not os.path.exists(parent):
                os.makedirs(parent, exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(content)
            return {"success": True, "filePath": file_path, "bytesWritten": len(content)}
        except Exception as e:
            return {"error": str(e)}

    def execute_command(self, command: str) -> Dict[str, Any]:
        try:
            if "rm -rf /" in command or "format c:" in command:
                return {"error": "Command blocked by security policy"}
            
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout[:4000],
                "stderr": result.stderr[:1000]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

workspace_tools = WorkspaceTools()
