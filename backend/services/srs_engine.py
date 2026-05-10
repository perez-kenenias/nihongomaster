import math
from datetime import datetime, timedelta

DECAY = -0.5
FACTOR = 19.0 / 81.0

MINIMUM_STABILITY = 0.01
INITIAL_DIFFICULTY = 0.3
INITIAL_STABILITY = 1.0
INITIAL_S = 0.1

W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
     0.34, 1.26, 0.29, 2.61]


def _stability_after_success(d: float, s: float, r: float, rating: str) -> float:
    if rating == "again":
        return max(0.1, s * 0.5)
    hard_penalty = 1.2 if rating == "hard" else 1.0
    easy_bonus = math.exp(W[6]) if rating == "easy" else 1.0
    return s * (1 + math.exp(W[8]) * (11 - d) * math.pow(s, -W[9]) *
                (math.exp((1 - r) * W[10]) - 1) * hard_penalty * easy_bonus)


def _difficulty_after_review(d: float, rating: str) -> float:
    if rating == "again":
        return min(1.0, d + W[4])
    elif rating == "hard":
        return min(1.0, d + W[5])
    elif rating == "good":
        return min(1.0, d - W[6] * (1.0 - d))
    else:
        return min(1.0, d - W[7] * 1.0)


def _next_interval(s: float) -> timedelta:
    return timedelta(days=max(1, round(s * FACTOR)))


def init_card() -> dict:
    return {
        "stability": INITIAL_STABILITY,
        "difficulty": INITIAL_DIFFICULTY,
        "state": 0,
    }


def review_card(stability: float, difficulty: float, state: int, rating: str):
    retrievability = math.exp(
        math.log(0.9) * 1.0 / max(stability, 0.01)
    ) if stability > 0 else 1.0

    if rating == "again":
        new_stability = _stability_after_success(difficulty, stability, retrievability, "again")
        new_difficulty = _difficulty_after_review(difficulty, "again")
        next_review = datetime.utcnow() + timedelta(minutes=10)
        new_state = 1
    else:
        new_difficulty = _difficulty_after_review(difficulty, rating)
        new_stability = _stability_after_success(new_difficulty, stability, retrievability, rating)
        next_review = datetime.utcnow() + _next_interval(new_stability)
        new_state = max(state + 1, 2)

    return {
        "stability": new_stability,
        "difficulty": new_difficulty,
        "next_review": next_review,
        "state": new_state,
    }


def get_due_cards_query(session, deck_id: str, limit: int = 20):
    from models.db_models import Card
    now = datetime.utcnow()

    due = session.query(Card).filter(
        Card.deck_id == deck_id,
        (Card.next_review == None) | (Card.next_review <= now)
    ).order_by(Card.next_review.asc().nullsfirst()).limit(limit).all()

    if len(due) < limit:
        remaining = limit - len(due)
        pending_ids = [c.id for c in due]
        new_cards = session.query(Card).filter(
            Card.deck_id == deck_id,
            ~Card.id.in_(pending_ids),
            Card.next_review == None,
        ).limit(remaining).all()
        due.extend(new_cards)

    return due[:limit]
