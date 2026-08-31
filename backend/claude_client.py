import os
from dotenv import load_dotenv

load_dotenv()

PROVIDER = os.getenv("AI_PROVIDER", "mock").lower()  # "mock" | "claude" | "gemini"

# Debug: print env state at startup (safe — only shows key presence, not value)
print(f"[AI] Provider: {PROVIDER}")
print(f"[AI] GEMINI_API_KEY set: {bool(os.getenv('GEMINI_API_KEY'))}")

if PROVIDER == "gemini":
    from gemini_client import GeminiAnthropicShim
    client = GeminiAnthropicShim()
    print("[AI] Using REAL Gemini API.")
elif PROVIDER == "claude":
    from anthropic import Anthropic
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    print("[AI] Using REAL Claude API.")
else:
    from mock_claude import MockAnthropic
    client = MockAnthropic()
    print("[AI] Using MOCK client -- no real API calls will be made.")