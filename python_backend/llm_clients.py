import httpx
from key_vault import key_vault
from workspace_tools import workspace_tools

async def call_llm(agent_id: str, prompt: str, role: str, system_context: str = "") -> dict:
    bound_key_obj = key_vault.get_agent_key(agent_id)
    provider = bound_key_obj.get("provider", "openai") if bound_key_obj else "openai"
    api_key = bound_key_obj.get("key") if bound_key_obj else None
    key_id = bound_key_obj.get("keyId") if bound_key_obj else None

    result_text = ""
    prompt_tokens = max(1, len(prompt) // 4)
    completion_tokens = 0
    is_real_api = False

    files_info = workspace_tools.list_files("")
    file_list_str = ", ".join([item["name"] for item in files_info.get("items", [])[:10]]) if "items" in files_info else "package.json, python_backend/"
    system_prompt = f"You are an AI coding office agent ({role}) working in workspace files: [{file_list_str}]. Keep answers concise."

    try:
        if api_key and "demo-key" not in api_key and len(api_key) > 20:
            async with httpx.AsyncClient(timeout=25.0) as client:
                if provider in ["openai", "openrouter"]:
                    is_or = (provider == "openrouter" or (api_key and api_key.startswith("sk-or-")))
                    base_url = "https://openrouter.ai/api/v1/chat/completions" if is_or else "https://api.openai.com/v1/chat/completions"
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    }
                    if is_or:
                        headers["HTTP-Referer"] = "http://localhost:3000"
                        headers["X-Title"] = "Pixel Office AI Agents"

                    model_name = "nvidia/nemotron-3-ultra-550b-a55b:free" if is_or else "gpt-4o"

                    payload = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 800
                    }
                    resp = await client.post(base_url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        result_text = data["choices"][0]["message"]["content"]
                        usage = data.get("usage", {})
                        prompt_tokens = usage.get("prompt_tokens", prompt_tokens)
                        completion_tokens = usage.get("completion_tokens", len(result_text) // 4)
                        is_real_api = True

                elif provider == "anthropic":
                    headers = {
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01"
                    }
                    payload = {
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 800,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                    resp = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        result_text = data["content"][0]["text"]
                        usage = data.get("usage", {})
                        prompt_tokens = usage.get("input_tokens", prompt_tokens)
                        completion_tokens = usage.get("output_tokens", len(result_text) // 4)
                        is_real_api = True

                elif provider == "gemini":
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": f"{system_prompt}\n\nTask: {prompt}"}]}]
                    }
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        result_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        completion_tokens = len(result_text) // 4
                        is_real_api = True
    except Exception as e:
        print(f"[LLM Python] API Call failed for {provider}: {e}")

    if not is_real_api or not result_text:
        result_text = generate_simulated_response(role, prompt, file_list_str)
        completion_tokens = max(1, len(result_text) // 4)

    if key_id:
        key_vault.record_usage(key_id, prompt_tokens, completion_tokens, provider)

    return {
        "response": result_text,
        "provider": provider,
        "keyMasked": bound_key_obj.get("masked") if bound_key_obj else "N/A",
        "keyName": bound_key_obj.get("name") if bound_key_obj else "Default Fallback",
        "isRealAPI": is_real_api,
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens
    }

def generate_simulated_response(role: str, prompt: str, files_str: str) -> str:
    clean = prompt.lower()
    if "architect" in clean or "lead" in role.lower():
        return f"""[Python FastAPI Architect Blueprint]
1. Verified Workspace Files: [{files_str}]
2. Microservice API & Pydantic Schema specification generated.
3. Delegating frontend canvas components and backend API endpoints.
Status: READY_FOR_IMPLEMENTATION"""
    elif "frontend" in clean or "frontend" in role.lower():
        return """# FastAPI HTML5 Canvas Renderer Integration
from fastapi import FastAPI, WebSocket
app = FastAPI(title="Ctrl/Cubicles Pixel Office")
# WebSocket broadcast active at 60 FPS"""
    elif "backend" in clean or "backend" in role.lower():
        return """# Python FastAPI Async REST Controller
@app.post("/api/tasks/dispatch")
async def dispatch_task(payload: TaskDispatchSchema):
    result = await agent_manager.dispatch_task(payload.agent_id, payload.task)
    return {"success": True, "result": result}"""
    elif "qa" in clean or "security" in role.lower():
        return """[QA & Security Compliance Audit - Python Backend]
✔ Fernet/AES-256 Key Vault Encryption: Verified.
✔ FastAPI Async Event Loop: 3.8ms response latency.
✔ Test Suite: 7/7 Tests Passed.
Status: APPROVED FOR PRODUCTION"""
    else:
        return f"""# Python Autonomous Agent Execution
print("Processing prompt: {prompt}")
# Workspace files scanned: [{files_str}]
# Execution completed successfully."""
