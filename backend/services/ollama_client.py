import os
import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")


async def ollama_chat(messages: list[dict], model: str = "elyza-jp-8b", stream: bool = False):
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": stream,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 512,
                }
            }
        )
        resp.raise_for_status()
        return resp.json()


async def ollama_generate(prompt: str, model: str = "elyza-jp-8b", stream: bool = False):
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 512,
                }
            }
        )
        resp.raise_for_status()
        return resp.json()
