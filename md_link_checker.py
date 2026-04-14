import os
import re
from urllib.parse import urlparse

vault_dir = "vault"
link_pattern = re.compile(r'\[.*?\]\((file://[^)]+)\)')

broken_code_links = []
local_base = "/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/"

for root, dirs, files in os.walk(vault_dir):
    for f in files:
        if f.endswith(".md"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as file:
                content = file.read()
                links = link_pattern.findall(content)
                for link in links:
                    # Strip any #L123 fragment
                    link_no_frag = link.split('#')[0]
                    # Convert file:// URI to local path
                    if link_no_frag.startswith("file://"):
                        local_path = link_no_frag[7:]
                        if not os.path.exists(local_path):
                            broken_code_links.append((fpath, local_path))

if broken_code_links:
    print("Found broken code links (doc references a missing file):")
    for doc, path in broken_code_links:
        print(f"{doc} -> {path}")
else:
    print("No broken file:// code links found.")
