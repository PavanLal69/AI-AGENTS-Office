import unittest
import os
import sys

sys.path.append(os.path.dirname(__file__))

from key_vault import key_vault
from workspace_tools import workspace_tools
from memory_store import memory_store
from git_service import git_service
from main import app, missions_db
from fastapi.testclient import TestClient

client = TestClient(app)

class TestPythonBackend(unittest.TestCase):

    def test_key_vault_encryption(self):
        key_id = key_vault.save_key("test_py_01", "Python Test Key", "openai", "sk-proj-python-secret-12345")
        self.assertIsNotNone(key_id)
        
        kobj = key_vault.keys.get(key_id)
        self.assertEqual(kobj["name"], "Python Test Key")
        self.assertEqual(kobj["provider"], "openai")
        self.assertEqual(kobj["key"], "sk-proj-python-secret-12345")

    def test_key_binding(self):
        bound = key_vault.bind_agent_key("agent_alex", "key_anthropic_primary")
        self.assertTrue(bound)
        
        bound_key = key_vault.get_agent_key("agent_alex")
        self.assertIsNotNone(bound_key)
        self.assertEqual(bound_key["keyId"], "key_anthropic_primary")

    def test_workspace_tools_list(self):
        res = workspace_tools.list_files("")
        self.assertIn("items", res)
        self.assertTrue(isinstance(res["items"], list))

    def test_memory_store_append(self):
        mem = memory_store.append_task("agent_py_test", {
            "prompt": "Python Unit Test Prompt",
            "response": "Python Unit Test Response",
            "provider": "openai"
        })
        self.assertGreater(mem["tasksCount"], 0)
        self.assertIn("history", mem)

    def test_git_service_status(self):
        status = git_service.get_status()
        self.assertIn("isGitRepo", status)

    def test_fastapi_mission_creation(self):
        res = client.post("/mission", json={"prompt": "Build Netflix Clone"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("mission_id", data)
        self.assertEqual(data["prompt"], "Build Netflix Clone")
        self.assertGreater(len(data["dag_tasks"]), 0)

        # Test querying mission
        mres = client.get(f"/mission/{data['mission_id']}")
        self.assertEqual(mres.status_code, 200)
        mdata = mres.json()
        self.assertEqual(mdata["prompt"], "Build Netflix Clone")

if __name__ == "__main__":
    print("=======================================================")
    print("RUNNING PYTHON FASTAPI BACKEND TEST SUITE")
    print("=======================================================")
    unittest.main()
