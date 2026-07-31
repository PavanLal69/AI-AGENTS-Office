import subprocess
import os
from typing import Dict, Any

WORKSPACE_ROOT = os.getcwd()

class GitService:
    def __init__(self):
        self.cwd = WORKSPACE_ROOT

    def _exec_git(self, args: str) -> Dict[str, Any]:
        try:
            res = subprocess.run(
                f"git {args}",
                shell=True,
                cwd=self.cwd,
                capture_output=True,
                text=True,
                timeout=15
            )
            return {"success": res.returncode == 0, "stdout": res.stdout.strip(), "stderr": res.stderr.strip()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        res = self._exec_git("status --porcelain")
        if not res["success"]:
            return {"isGitRepo": False, "status": []}

        lines = res["stdout"].split("\n") if res["stdout"] else []
        files = [{"state": line[:2].strip(), "file": line[3:].strip()} for line in lines if len(line) >= 4]
        return {"isGitRepo": True, "files": files}

    def create_branch(self, agent_name: str, feature_name: str) -> Dict[str, Any]:
        clean_agent = agent_name.lower().replace(" ", "-")
        clean_feat = feature_name.lower().replace(" ", "-")
        branch_name = f"agent/{clean_agent}-{clean_feat}"
        res = self._exec_git(f"checkout -b {branch_name}")
        return {"success": res["success"], "branch": branch_name, "message": res.get("stdout") or res.get("stderr")}

    def commit_changes(self, agent_name: str, message: str) -> Dict[str, Any]:
        self._exec_git("add .")
        clean_msg = message.replace('"', '\\"')
        res = self._exec_git(f'commit -m "[Agent: {agent_name}] {clean_msg}"')
        return {"success": res["success"], "message": res.get("stdout") or res.get("stderr")}

git_service = GitService()
