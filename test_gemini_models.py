#!/usr/bin/env python3
"""
Test script to check available Gemini models and validate the API key.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

def list_available_models():
    """List all available Gemini models for this API key"""
    print("=" * 60)
    print("Checking Available Gemini Models")
    print("=" * 60)
    print(f"API Key: {API_KEY[:20]}...{API_KEY[-4:]}")
    print()

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "models" in data:
            print(f"✅ Found {len(data['models'])} available models:\n")
            for model in data['models']:
                name = model.get('name', 'Unknown')
                display_name = model.get('displayName', 'N/A')
                description = model.get('description', 'N/A')

                print(f"📦 {name}")
                print(f"   Display Name: {display_name}")
                print(f"   Description: {description[:80]}...")
                print()
            return True
        else:
            print("❌ No models found in response")
            return False

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"Response: {e.response.text if e.response else 'No response'}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_specific_model(model_name):
    """Test a specific model with a simple prompt"""
    print("=" * 60)
    print(f"Testing Model: {model_name}")
    print("=" * 60)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{
            "parts": [{
                "text": "What is 2+2? Answer in one word."
            }]
        }]
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()

        if "candidates" in data and data["candidates"]:
            result = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"✅ Model Response: {result}")
            return True
        else:
            print(f"❌ Unexpected response format: {data}")
            return False

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error {e.response.status_code}: {e}")
        print(f"Response: {e.response.text if e.response else 'No response'}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if not API_KEY:
        print("❌ GEMINI_API_KEY not found in .env file!")
        exit(1)

    # List available models
    models_ok = list_available_models()

    print("\n")

    # Test common model names
    test_models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ]

    print("=" * 60)
    print("Testing Common Model Names")
    print("=" * 60)

    for model in test_models:
        test_specific_model(model)
        print()
