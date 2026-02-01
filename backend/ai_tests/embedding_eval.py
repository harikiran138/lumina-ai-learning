import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def evaluate_embeddings(text1_vec, text2_vec):
    """
    Computes cosine similarity between two embedding vectors.
    """
    vec1 = np.array(text1_vec).reshape(1, -1)
    vec2 = np.array(text2_vec).reshape(1, -1)

    similarity = cosine_similarity(vec1, vec2)[0][0]
    return similarity


if __name__ == "__main__":
    # Mock examples (e.g. from Ollama embeddings)
    v1 = [0.1, 0.2, 0.3, 0.4]
    v2 = [0.1, 0.2, 0.3, 0.5]

    score = evaluate_embeddings(v1, v2)
    print(f"Cosine Similarity: {score:.4f}")

    if score > 0.9:
        print("Embeddings are Highly Similar - PASS")
    else:
        print("Embeddings Differ - REVIEW")
