import os

PROJECT_ROOT = "."
VAULT_ROOT = "vault/Files"
EXCLUDE_DIRS = {".git", "node_modules", "venv", "__pycache__", ".next", "dist", "build"}
INCLUDE_EXTS = {".py", ".ts", ".tsx", ".sql", ".md", ".sh", ".yml", ".json", ".yaml"}

def generate_note_content(file_path):
    file_name = os.path.basename(file_path)
    rel_path = os.path.relpath(file_path, PROJECT_ROOT)
    
    content = f"# File: {file_name}\n\n"
    content += f"## 📂 Location\n`{rel_path}`\n\n"
    content += "## 🎯 Purpose\n(Auto-generated skeleton. Detailed purpose to be filled in for critical path files.)\n\n"
    content += "## 📥 Inputs\n- (To be analyzed)\n\n"
    content += "## ⚙️ Processing Logic\n- (To be analyzed)\n\n"
    content += "## 📤 Outputs\n- (To be analyzed)\n\n"
    content += "## 🔗 Dependencies\n"
    
    # Simple dependency analysis for Python/TS
    try:
        if file_path.endswith(('.py', '.ts', '.tsx')):
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                deps = []
                for line in lines:
                    if line.startswith(('import ', 'from ')) or 'require(' in line or 'import {' in line:
                        deps.append(line.strip())
                if deps:
                    content += "\n".join([f"- `{d}`" for d in deps[:10]])
                else:
                    content += "- None detected"
        else:
            content += "- N/A"
    except Exception as e:
        content += f"- Error reading file: {e}"
        
    content += "\n\n## 🧠 Internal Connections\n- [[MODULE_MAP]]\n"
    
    return content

def main():
    if not os.path.exists(VAULT_ROOT):
        os.makedirs(VAULT_ROOT)
        
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        
        if "vault" in root: # Don't scan the vault itself
            continue
            
        for file in files:
            if any(file.endswith(ext) for ext in INCLUDE_EXTS):
                file_path = os.path.join(root, file)
                rel_dir = os.path.relpath(root, PROJECT_ROOT)
                target_dir = os.path.join(VAULT_ROOT, rel_dir)
                
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)
                
                target_file = os.path.join(target_dir, file + ".md")
                
                try:
                    with open(target_file, 'w', encoding='utf-8') as f:
                        f.write(generate_note_content(file_path))
                except Exception as e:
                    print(f"Failed to create {target_file}: {e}")

if __name__ == "__main__":
    main()
