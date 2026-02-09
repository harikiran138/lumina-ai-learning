import os
import re
from typing import Dict, Any


class SkillManager:
    """
    Manages the intelligence 'Skills' available to the AI Agent.
    Skills are stored in the /skills directory as SKILL.md files with YAML frontmatter.
    """

    def __init__(self, skills_dir: str = "../skills"):
        self.skills_dir = skills_dir
        self.skills = {}
        self.refresh_skills()

    def refresh_skills(self):
        """Scan the skills directory and load skill metadata."""
        if not os.path.exists(self.skills_dir):
            # Try absolute path if relative fails (useful for different run contexts)
            alt_path = os.path.join(os.getcwd(), "skills")
            if os.path.exists(alt_path):
                self.skills_dir = alt_path
            else:
                return

        for skill_name in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_name)
            if os.path.isdir(skill_path):
                skill_md_path = os.path.join(skill_path, "SKILL.md")
                if os.path.exists(skill_md_path):
                    metadata = self._parse_skill_md(skill_md_path)
                    if metadata:
                        self.skills[skill_name] = metadata

    def _parse_skill_md(self, path: str) -> Dict[str, Any]:
        """Simple manual parser for YAML frontmatter in SKILL.md."""
        try:
            with open(path, "r") as f:
                content = f.read()

            # Match frontmatter: --- ... ---
            match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            if not match:
                return None

            frontmatter = match.group(1)
            metadata = {}
            for line in frontmatter.split("\n"):
                if ":" in line:
                    key, value = line.split(":", 1)
                    metadata[key.strip()] = value.strip()

            # Optionally include a snippet of the instructions
            instructions = content[match.end() :].strip()
            metadata["instructions_snippet"] = instructions[:500] + "..."

            return metadata
        except Exception:
            return None

    def get_skills_summary(self) -> str:
        """Returns a string summary of all skills for injection into system prompts."""
        if not self.skills:
            return "No specialized skills currently available."

        summary = "AVAILABLE SPECIALIZED SKILLS:\n"
        for name, meta in self.skills.items():
            desc = meta.get("description", "No description available.")
            summary += f"- {name}: {desc}\n"

        summary += "\nTo use a skill, follow the specific instructions associated with it if the user's request matches its purpose."
        return summary


# Singleton instance
_skill_manager = None


def get_skill_manager() -> SkillManager:
    global _skill_manager
    if _skill_manager is None:
        # Base dir relative to this file (api_engine/skills.py) is ../../skills
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        skills_path = os.path.join(base_dir, "skills")
        _skill_manager = SkillManager(skills_path)
    return _skill_manager
