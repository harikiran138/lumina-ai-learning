import os
import re

vault_dir = "vault"
files = []
for root, dirs, filenames in os.walk(vault_dir):
    for f in filenames:
        if f.endswith(".md"):
            files.append(os.path.join(root, f))

# Find all links
link_pattern_bracket = re.compile(r'\[\[([^\]\|]+)(?:\|[^\]]+)?\]\]')
link_pattern_md = re.compile(r'\[.+?\]\(([^)]+\.md)\)')

referenced = set()
for fpath in files:
    with open(fpath, "r", encoding="utf-8") as file:
        content = file.read()
        brackets = link_pattern_bracket.findall(content)
        for b in brackets:
            # simple matching by filename
            referenced.add(b.split('/')[-1])
        mds = link_pattern_md.findall(content)
        for m in mds:
            referenced.add(os.path.basename(m))

print("Total markdown files:", len(files))
orphans = []
for fpath in files:
    basename = os.path.basename(fpath)
    if basename not in referenced:
        orphans.append(fpath)

print("Possible orphaned files (no incoming links found based on standard syntax):")
for o in sorted(orphans):
    print(" - " + o)
