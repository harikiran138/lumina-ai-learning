import requests
import os

# Hardcode the key for debugging or read from env if I can sourcing it
API_KEY = "AIzaSyCyggfn8Kg8sD9QWCb-mifvunpVKskHNVQ"

def list_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        resp = requests.get(url)
        print(f"List Models Status: {resp.status_code}")
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            print("Available generation models:")
            for m in models:
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    print(f" - {m['name']}")
        else:
            print(resp.text)
    except Exception as e:
        print(f"Error listing models: {e}")

def test_generate(model_name):
    print(f"\nTesting generation with {model_name}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": "Hello, say hi."}]}]
    }
    headers = {"Content-Type": "application/json"}
    try:
        resp = requests.post(url, json=payload, headers=headers)
        print(f"Generate Status: {resp.status_code}")
        print(resp.text[:200]) # First 200 chars
    except Exception as e:
        print(f"Error generating: {e}")

if __name__ == "__main__":
    list_models()
    # test_generate("models/gemini-pro")
