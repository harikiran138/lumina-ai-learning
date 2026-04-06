import json
import os
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
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
    {text}
    --- END RAW TEXT ---
    
    Return the result in a structured format with modules and topics.
    """

    JSON_SCHEMA_HINT = """
IMPORTANT: You MUST return a valid JSON object following this schema:
{
  "title": "Course Title",
  "description": "Engaging description",
  "level": "Beginner|Intermediate|Advanced",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "topics": [
        {
          "title": "Topic title",
          "description": "Topic description",
          "duration_minutes": 45
        }
      ]
    }
  ]
}
"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or not genai:
            print("WARNING: GEMINI_API_KEY not found or google-genai not installed. Blueprint generator will use mock data.")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)

    async def generate(self, raw_text: str) -> dict:
        if not self.client:
            return self._generate_mock(raw_text)
        
        prompt = f"""{self.SYSTEM_PROMPT}

{self.USER_PROMPT_TEMPLATE.format(text=raw_text[:15000])}

{self.JSON_SCHEMA_HINT}
"""
        try:
            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type='application/json'
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini Blueprint Error: {str(e)}")
            return self._generate_mock(raw_text)

    async def generate_from_image(self, image_path: str) -> dict:
        """Processes an image/photo of a syllabus or textbook content directly."""
        if not self.client:
             return self._generate_mock(f"From image: {image_path}")
        
        prompt = f"""{self.SYSTEM_PROMPT}

Analyze this image (photo) of a syllabus, textbook table of contents, or course outline.
Extract the structured course information.

{self.JSON_SCHEMA_HINT}
"""
        try:
            from PIL import Image
            img = Image.open(image_path)
            
            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[prompt, img],
                config=types.GenerateContentConfig(
                    response_mime_type='application/json'
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini Image Blueprint Error: {str(e)}")
            return self._generate_mock(f"Recovery from image error: {str(e)}")

    def _generate_mock(self, source_text: str) -> dict:
        """Fallback mock implementation."""
        title = "AI-Generated Course"
        if "from image" in source_text.lower():
            title = "Course from Image Analysis"
            
        modules = [
             BlueprintModule(title="Foundation", description="Core concepts from the provided document/image", topics=[
                  BlueprintTopic(title="Introduction", description="Overview of the content"),
                  BlueprintTopic(title="Core Principles", description="Detailed analysis of key themes identified by AI")
             ])
        ]
        
        return BlueprintResult(
            title=title,
            description="A course blueprint generated from your uploaded materials.",
            modules=modules
        ).model_dump()
