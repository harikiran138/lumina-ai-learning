class DKTModel:
    """
    Deep Knowledge Tracing Model (LSTM/Transformer wrapper).
    """
    def predict_sequence(self, exercise_sequence: list) -> list:
        return [0.5] * len(exercise_sequence)
