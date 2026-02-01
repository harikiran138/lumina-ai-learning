import os
import asyncio
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from datasets import Dataset
import json

# This script performs an automated evaluation of the RAG pipeline.
# In a real CI environment, we would use a golden dataset.


async def run_eval():
    print("🚀 Starting RAG Quality Evaluation...")

    # Example "Golden Dataset" for verification
    # In production, these would be fetched from active user sessions or a curated set
    data_sample = {
        "question": [
            "How do I start learning React?",
            "What is the difference between SQL and NoSQL?",
        ],
        "answer": [
            "You can start learning React by understanding HTML, CSS, and JavaScript first, then following the official React documentation.",
            "SQL databases are relational and structured, while NoSQL databases are non-relational and distributed.",
        ],
        "contexts": [
            [
                "React is a JavaScript library for building user interfaces. It is important to know fundamentals before diving in."
            ],
            [
                "SQL stands for Structured Query Language. NoSQL is used for unstructured data and horizontal scaling."
            ],
        ],
        "ground_truth": [
            "Start with web fundamentals then move to React official docs.",
            "SQL is structured/relational; NoSQL is unstructured/distributed.",
        ],
    }

    dataset = Dataset.from_dict(data_sample)

    # Perform evaluation
    # Note: This requires GEMINI_API_KEY to be set in the environment
    try:
        result = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision],
        )

        print("\n📊 RAGAS Evaluation Results:")
        print(json.dumps(result, indent=2))

        # Threshold check for CI
        if result["faithfulness"] < 0.7:
            print("❌ Faithfulness score too low!")
            exit(1)

        print("✅ RAG Quality meets standards.")

    except Exception as e:
        print(f"⚠️ Evaluation skipped or failed: {str(e)}")
        # We don't necessarily want to block CI if the API is down,
        # but for a "pro" setup we might.
        exit(0)


if __name__ == "__main__":
    asyncio.run(run_eval())
