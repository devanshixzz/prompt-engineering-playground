import os

from google import genai
from google.genai import types


class LLMService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3.6-flash"

    def generate(
        self,
        user_prompt,
        system_prompt=None,
        temperature=0.7,
        top_p=0.9,
        max_tokens=1000
    ):
        config = types.GenerateContentConfig(
            temperature=temperature,
            top_p=top_p,
            max_output_tokens=max_tokens,
            system_instruction=system_prompt
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=config
        )

        return response.text or ""