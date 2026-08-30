"""
Mock Claude client — mimics the real Anthropic SDK response shape
so the rest of the app can be built/tested without live API calls.
"""

class MockContentBlock:
    def __init__(self, text):
        self.text = text

class MockResponse:
    def __init__(self, text):
        self.content = [MockContentBlock(text)]

class MockMessages:
    def create(self, model, max_tokens, messages):
        user_content = messages[-1]["content"] if messages else ""

        if "docstring" in user_content.lower():
            fake_response = (
                '"""\n'
                "Auto-generated mock docstring.\n"
                "This function's purpose is inferred from its structure.\n"
                '"""\n'
                "(MOCK — no real API call was made.)"
            )
        else:
            fake_response = (
                "This function performs its defined logic based on the given inputs. "
                "(This is a MOCK response — no real API call was made.)"
            )

        return MockResponse(fake_response)

class MockAnthropic:
    def __init__(self, api_key=None):
        self.messages = MockMessages()