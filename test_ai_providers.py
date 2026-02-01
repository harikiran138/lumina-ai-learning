#!/usr/bin/env python3
"""
Quick test script to verify both Gemini and Ollama are working correctly.
"""
import os
import sys

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from ai_engine.llm import get_llm_provider

def test_gemini():
    """Test Gemini API"""
    print("🔍 Testing Gemini API...")
    try:
        llm = get_llm_provider("gemini")
        response = llm.generate("What is 2+2? Answer in one word.", "")
        print(f"✅ Gemini Response: {response[:100]}")
        return True
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return False

def test_ollama():
    """Test Ollama"""
    print("\n🔍 Testing Ollama...")
    try:
        llm = get_llm_provider("ollama")
        response = llm.generate("What is 2+2? Answer in one word.", "")
        print(f"✅ Ollama Response: {response[:100]}")
        return True
    except Exception as e:
        print(f"❌ Ollama Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AI Provider Verification Test")
    print("=" * 60)

    gemini_ok = test_gemini()
    ollama_ok = test_ollama()

    print("\n" + "=" * 60)
    print("RESULTS:")
    print(f"  Gemini: {'✅ WORKING' if gemini_ok else '❌ FAILED'}")
    print(f"  Ollama: {'✅ WORKING' if ollama_ok else '❌ FAILED'}")
    print("=" * 60)

    if gemini_ok or ollama_ok:
        print("\n✅ At least one AI provider is working!")
        sys.exit(0)
    else:
        print("\n❌ Both AI providers failed. Check configuration.")
        sys.exit(1)
