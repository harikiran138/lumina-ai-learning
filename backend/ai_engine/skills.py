from dataclasses import dataclass
from typing import List


@dataclass
class SkillManager:
    available_skills: List[str]

    def list_skills(self) -> List[str]:
        return self.available_skills

    def match(self, _prompt: str) -> List[str]:
        return []


def get_skill_manager(*args, **kwargs):
    return SkillManager(available_skills=[])
