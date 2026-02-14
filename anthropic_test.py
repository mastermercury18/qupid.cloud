import os
import anthropic

api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
print("key_set:", bool(api_key), "len:", len(api_key))

client = anthropic.Anthropic(api_key=api_key)

resp = client.messages.create(
    model="claude-3-5-haiku-latest",
    max_tokens=20,
    messages=[{"role": "user", "content": "Say hello"}],
)
print(resp.content[0].text)
