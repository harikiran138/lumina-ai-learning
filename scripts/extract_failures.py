import json, sys
with open("COMPREHENSIVE_SYSTEM_TEST_REPORT.json") as f:
    d = json.load(f)
fails = [r for r in d["detailed_results"] if not r["passed"]]
for r in fails:
    print(f"{r['role']:<20} [{r['type']:>12}] [{r['category']:>20}] {r['name']}")
