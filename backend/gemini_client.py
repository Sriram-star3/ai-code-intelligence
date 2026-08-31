import os
from google import genai


class GeminiContentBlock:
    def __init__(self, text):
        self.text = text


class GeminiResponse:
    def __init__(self, text):
        self.content = [GeminiContentBlock(text)]


class GeminiMessages:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Add it in Railway > Variables."
            )
        self._client = genai.Client(api_key=api_key)

    def create(self, model, max_tokens, messages):
        prompt = "\n".join(m["content"] for m in messages)

        response = self._client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        return GeminiResponse(response.text)


class GeminiAnthropicShim:
    def __init__(self):
        self.messages = GeminiMessages()