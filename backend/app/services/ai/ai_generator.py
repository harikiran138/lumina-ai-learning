import json
import os
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List, Optional

class BlueprintTopic(BaseModel):
    title: str = Field(..., description="Short, clear title of the topic")
    description: str = Field(..., description="Brief overview of what this topic covers")
    duration_minutes: int = Field(default=45, description="Estimated time to complete this topic")

class BlueprintModule(BaseModel):
    title: str = Field(..., description="Module title (e.g. 'Introduction to Neural Networks')")
    description: str = Field(..., description="Comprehensive description of the module's goals")
    topics: List[BlueprintTopic] = Field(default_factory=list, description="Sequence of topics in this module")

class BlueprintResult(BaseModel):
    title: str = Field(..., description="Suggested course title")
    description: str = Field(..., description="Engaging course description")
    level: str = Field(default="Beginner", description="Recommended difficulty level")
    modules: List[BlueprintModule] = Field(default_factory=list, description="Structured roadmap of learning modules")

class LuminaCourseBlueprintGenerator:
    """Specialized AI generator for course blueprints from raw text (PDF extraction)."""
    
    SYSTEM_PROMPT = """You are Lumina's Lead Content Architect. 
Your goal is to transform raw PDF text into a structured, pedagogical course blueprint.
Break down the content into a logical sequence of modules and topics.
Ensure the tone is professional, engaging, and clear.
"""

    USER_PROMPT_TEMPLATE = """Analyze the following text from a syllabus or textbook and extract a complete course structure:
    
    --- RAW TEXT ---
    {{text}}
    --- END RAW TEXT ---
    
    Return the result in a structured format with modules and topics.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found. Blueprint generator will use mock data.")
            self.has_client = False
        else:
            genai.configure(api_key=self.api_key)
            self.has_client = True

    async def generate(self, raw_text: str) -> dict:
        if not self.has_client:
            return self._generate_mock(raw_text)
        
        prompt = f"""{self.SYSTEM_PROMPT}

{self.USER_PROMPT_TEMPLATE.format(text=raw_text[:15000])}

IMPORTANT: You MUST return a valid JSON object following this schema:
{{
  "title": "Course Title",
  "description": "Engaging description",
  "level": "Beginner|Intermediate|Advanced",
  "modules": [
    {{
      "title": "Module Title",
      "description": "Module description",
      "topics": [
        {{
          "title": "Topic title",
          "description": "Topic description",
          "duration_minutes": 45
        }}
      ]
    }}
  ]
}}
"""
        try:
            # Use generate_text for older library versions (v0.1.0rc1)
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt=prompt
            )
            if hasattr(response, 'result') and response.result:
                return json.loads(response.result)
            return self._generate_mock(raw_text)
        except Exception as e:
            print(f"Gemini Blueprint Error: {str(e)}")
            return self._generate_mock(raw_text)

    def _generate_mock(self, raw_text: str) -> dict:
        """Fallback mock implementation."""
        title = "AI-Generated Course"
        
        return {
            "title": title,
            "description": "A course blueprint generated from your document.",
            "level": "Beginner",
            "modules": [
                {
                    "title": "Foundation",
                    "description": "Core concepts from the document",
                    "topics": [
                        {"title": "Introduction", "description": "Overview of the content", "duration_minutes": 45},
                        {"title": "Core Principles", "description": "Detailed analysis of key themes", "duration_minutes": 45}
                    ]
                }
            ]
        }
