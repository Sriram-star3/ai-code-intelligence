import os
from google import genai

_gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class GeminiContentBlock:
    def __init__(self, text):
        self.text = text


class GeminiResponse:
    def __init__(self, text):
        self.content = [GeminiContentBlock(text)]


class GeminiMessages:
    def create(self, model, max_tokens, messages):
        prompt = "\n".join(m["content"] for m in messages)

        response = _gemini.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )

        return GeminiResponse(response.text)


class GeminiAnthropicShim:
    def __init__(self):
        self.messages = GeminiMessages()