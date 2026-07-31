import os
import json
import base64
import time
from typing import Dict, List, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
KEYS_FILE = os.path.join(DATA_DIR, "keys_store.json")
SECRET_KEY = os.getenv("KEY_SECRET", "pixel-office-secret-key-python-32b!")

class KeyVault:
    def __init__(self):
        self.keys: Dict[str, dict] = {}
        self.agent_bindings: Dict[str, str] = {}
        self.telemetry: Dict[str, dict] = {}
        self.fernet = self._init_fernet()
        self._ensure_data_dir()
        self.load_store()

    def _ensure_data_dir(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)

    def _init_fernet(self) -> Fernet:
        salt = b"pixel_office_salt_2026"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(SECRET_KEY.encode()))
        return Fernet(key)

    def encrypt(self, text: str) -> str:
        try:
            return self.fernet.encrypt(text.encode()).decode()
        except Exception:
            return base64.b64encode(text.encode()).decode()

    def decrypt(self, text: str) -> str:
        try:
            return self.fernet.decrypt(text.encode()).decode()
        except Exception:
            try:
                return base64.b64decode(text.encode()).decode()
            except Exception:
                return text

    def mask_key(self, raw_key: str) -> str:
        if not raw_key:
            return "N/A"
        if raw_key.startswith("http"):
            return raw_key
        if len(raw_key) <= 10:
            return "***"
        return raw_key[:6] + "..." + raw_key[-4:]

    def load_store(self):
        if os.path.exists(KEYS_FILE):
            try:
                with open(KEYS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if "keys" in data:
                    for k in data["keys"]:
                        raw_key = self.decrypt(k.get("encryptedKey", ""))
                        key_id = k["id"]
                        self.keys[key_id] = {
                            "id": key_id,
                            "name": k["name"],
                            "provider": k["provider"],
                            "key": raw_key,
                            "masked": self.mask_key(raw_key)
                        }
                        self.telemetry[key_id] = k.get("telemetry", {
                            "requests": 0,
                            "promptTokens": 0,
                            "completionTokens": 0,
                            "estimatedCostUsd": 0.0,
                            "lastUsed": None,
                            "status": "ACTIVE"
                        })

                if "bindings" in data:
                    self.agent_bindings = data["bindings"]
            except Exception as e:
                print(f"[KeyVault] Load store error: {e}")

        if not self.keys:
            self._add_default_keys()

        self.save_key(
            "key_openrouter_nvidia",
            "NVIDIA Nemotron 3 Ultra (Thinking, Planning & Design)",
            "openrouter",
            os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR_OPENROUTER_API_KEY_NVIDIA")
        )
        self.save_key(
            "key_openrouter_cohere",
            "Cohere North Mini Code (Coding & Implementation)",
            "openrouter",
            os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR_OPENROUTER_API_KEY_COHERE")
        )
        self.save_key(
            "key_openrouter_ling",
            "Ling 3.0 Flash (Researching & Analysis)",
            "openrouter",
            os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR_OPENROUTER_API_KEY_LING")
        )
        self.save_key(
            "key_openrouter_recraft",
            "Recraft V4.1 Vector (Image Generation & Graphics)",
            "openrouter",
            os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR_OPENROUTER_API_KEY_RECRAFT")
        )
        # Thinking, Planning & Design -> NVIDIA
        self.bind_agent_key("agent_alex", "key_openrouter_nvidia")
        self.bind_agent_key("agent_elena", "key_openrouter_nvidia")

        # Coding & Implementation -> Cohere North Mini
        self.bind_agent_key("agent_devon", "key_openrouter_cohere")
        self.bind_agent_key("agent_marcus", "key_openrouter_cohere")

        # Researching & QA -> Ling 3.0 Flash
        self.bind_agent_key("agent_sam", "key_openrouter_ling")
        self.bind_agent_key("agent_zara", "key_openrouter_ling")

        # Image Generation & Vector -> Recraft
        self.bind_agent_key("agent_maya", "key_openrouter_recraft")
        self.bind_agent_key("agent_kai", "key_openrouter_recraft")
        self.bind_agent_key("agent_riley", "key_openrouter_recraft")
        self.bind_agent_key("agent_viktor", "key_openrouter_recraft")

    def _add_default_keys(self):
        defaults = [
            {"id": "key_anthropic_primary", "name": "Anthropic Claude Primary", "provider": "anthropic", "key": os.getenv("ANTHROPIC_API_KEY", "sk-ant-demo-key-pixel-office-001")},
            {"id": "key_openai_primary", "name": "OpenAI GPT-4o Key", "provider": "openai", "key": os.getenv("OPENAI_API_KEY", "sk-proj-demo-key-pixel-office-002")},
            {"id": "key_gemini_primary", "name": "Google Gemini Pro Key", "provider": "gemini", "key": os.getenv("GEMINI_API_KEY", "AIzaSy-demo-key-pixel-office-003")},
            {"id": "key_openrouter_dev", "name": "OpenRouter Key Pool", "provider": "openrouter", "key": os.getenv("OPENROUTER_API_KEY", "sk-or-v1-demo-key-004")},
            {"id": "key_ollama_local", "name": "Ollama Local Instance", "provider": "ollama", "key": "http://localhost:11434"}
        ]
        for d in defaults:
            self.save_key(d["id"], d["name"], d["provider"], d["key"])

        self.bind_agent_key("agent_alex", "key_anthropic_primary")
        self.bind_agent_key("agent_maya", "key_openai_primary")
        self.bind_agent_key("agent_devon", "key_gemini_primary")
        self.bind_agent_key("agent_sam", "key_openrouter_dev")
        self.bind_agent_key("agent_riley", "key_ollama_local")

    def save_store(self):
        try:
            keys_export = []
            for key_id, v in self.keys.items():
                keys_export.append({
                    "id": key_id,
                    "name": v["name"],
                    "provider": v["provider"],
                    "encryptedKey": self.encrypt(v["key"]),
                    "masked": v["masked"],
                    "telemetry": self.telemetry.get(key_id, {})
                })

            with open(KEYS_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "keys": keys_export,
                    "bindings": self.agent_bindings,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                }, f, indent=2)
        except Exception as e:
            print(f"[KeyVault] Save store error: {e}")

    def save_key(self, key_id: Optional[str], name: str, provider: str, raw_key: str) -> str:
        kid = key_id or f"key_{provider}_{int(time.time() * 1000)}"
        self.keys[kid] = {
            "id": kid,
            "name": name,
            "provider": provider,
            "key": raw_key,
            "masked": self.mask_key(raw_key)
        }
        if kid not in self.telemetry:
            self.telemetry[kid] = {
                "requests": 0,
                "promptTokens": 0,
                "completionTokens": 0,
                "estimatedCostUsd": 0.0,
                "lastUsed": None,
                "status": "ACTIVE"
            }
        self.save_store()
        return kid

    def delete_key(self, key_id: str):
        self.keys.pop(key_id, None)
        self.telemetry.pop(key_id, None)
        self.agent_bindings = {a: k for a, k in self.agent_bindings.items() if k != key_id}
        self.save_store()

    def bind_agent_key(self, agent_id: str, key_id: str) -> bool:
        if key_id in self.keys:
            self.agent_bindings[agent_id] = key_id
            self.save_store()
            return True
        return False

    def get_agent_key(self, agent_id: str) -> Optional[dict]:
        key_id = self.agent_bindings.get(agent_id)
        if key_id and key_id in self.keys:
            return {"keyId": key_id, **self.keys[key_id]}
        first = next(iter(self.keys.values()), None)
        return {"keyId": first["id"], **first} if first else None

    def record_usage(self, key_id: str, prompt_tokens: int = 0, completion_tokens: int = 0, provider: str = "openai"):
        if not key_id or key_id not in self.telemetry:
            return

        stats = self.telemetry[key_id]
        stats["requests"] += 1
        stats["promptTokens"] += prompt_tokens
        stats["completionTokens"] += completion_tokens
        stats["lastUsed"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        prompt_rate = 0.003
        comp_rate = 0.015
        if provider == "gemini": prompt_rate, comp_rate = 0.000125, 0.0005
        elif provider == "openai": prompt_rate, comp_rate = 0.0025, 0.01
        elif provider == "ollama": prompt_rate, comp_rate = 0.0, 0.0

        cost = ((prompt_tokens / 1000.0) * prompt_rate) + ((completion_tokens / 1000.0) * comp_rate)
        stats["estimatedCostUsd"] += cost
        self.save_store()

    def get_all_keys(self) -> List[dict]:
        return [
            {
                "id": k,
                "name": v["name"],
                "provider": v["provider"],
                "masked": v["masked"],
                "telemetry": self.telemetry.get(k, {})
            }
            for k, v in self.keys.items()
        ]

    def get_bindings(self) -> Dict[str, str]:
        return dict(self.agent_bindings)

key_vault = KeyVault()
