import os

target = r"c:\Users\saisr\Documents\GitHub\lumina-ai-learning\backend\app\store\user_store.py"
with open(target, 'r') as f:
    content = f.read()

old_line = "        clean_updates = {k: v for k, v in updates.items() if k not in restricted and k in valid_columns}"
new_block = """        clean_updates = {}
        for k, v in updates.items():
            if k not in restricted and k in valid_columns:
                if k == "role":
                    clean_updates[k] = self.to_db_role(v)
                else:
                    clean_updates[k] = v"""

if old_line in content:
    content = content.replace(old_line, new_block)
    with open(target, 'w') as f:
        f.write(content)
    print("Replacement successful")
else:
    print("Old line not found. Content sample around expected line:")
    # Print sample content around where we expect the line
    import re
    matches = list(re.finditer("clean_updates", content))
    for m in matches:
        start = max(0, m.start() - 50)
        end = min(len(content), m.end() + 100)
        print(f"Match at {m.start()}: {repr(content[start:end])}")
