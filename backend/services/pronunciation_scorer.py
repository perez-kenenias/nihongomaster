def score_pronunciation(expected: str, actual: str) -> dict:
    expected_clean = expected.strip().lower()
    actual_clean = actual.strip().lower()

    if not actual_clean:
        return {"score": 0.0, "feedback": "No se detectó ninguna pronunciación. Intenta de nuevo.", "phoneme_scores": []}

    expected_chars = list(expected_clean)
    actual_chars = list(actual_clean)

    max_len = max(len(expected_chars), len(actual_chars))
    phoneme_scores = []

    for i in range(max_len):
        expected_char = expected_chars[i] if i < len(expected_chars) else None
        actual_char = actual_chars[i] if i < len(actual_chars) else None

        if expected_char is None:
            phoneme_scores.append({"char": actual_char, "score": 0.0, "status": "extra"})
        elif actual_char is None:
            phoneme_scores.append({"char": expected_char, "score": 0.0, "status": "missing"})
        elif expected_char == actual_char:
            phoneme_scores.append({"char": expected_char, "score": 1.0, "status": "correct"})
        else:
            phoneme_scores.append({"char": expected_char, "score": 0.0, "status": "incorrect"})

    total = len(phoneme_scores)
    correct = sum(1 for p in phoneme_scores if p["status"] == "correct")
    score = round((correct / total) * 100, 1) if total > 0 else 0.0

    if score >= 90:
        feedback = "¡Excelente pronunciación!" if score >= 95 else "Muy buena pronunciación."
    elif score >= 70:
        feedback = "Buena pronunciación. Presta atención a algunos sonidos."
    elif score >= 50:
        feedback = "Pronunciación aceptable. Sigue practicando."
    else:
        feedback = "Sigue intentando. Escucha el audio de referencia e intenta de nuevo."

    return {
        "score": score,
        "feedback": feedback,
        "phoneme_scores": phoneme_scores,
    }
