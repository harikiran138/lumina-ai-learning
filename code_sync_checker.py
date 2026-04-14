import os

files_to_check = [
    "backend/app/routers/ai_tutor.py",
    "backend/ai_engine/classifier.py",
    "backend/app/background/ai_agent_runner.py",
    "backend/app/routers/student.py"
]

for f in files_to_check:
    if not os.path.exists(f):
        print(f"Missing file: {f}")
    else:
        print(f"Found file: {f}")

