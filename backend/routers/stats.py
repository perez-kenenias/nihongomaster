from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import defaultdict

from models.database import get_db
from models.db_models import Card

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.query(Card).count()

    reviewed_today = db.query(Card).filter(
        Card.last_review >= today_start
    ).count()

    due = db.query(Card).filter(
        Card.next_review != None,
        Card.next_review <= now
    ).count()

    new_c = db.query(Card).filter(Card.next_review == None).count()

    mature = db.query(Card).filter(Card.state >= 2, Card.stability >= 21).count()
    young = db.query(Card).filter(Card.state >= 1, Card.stability < 21).count()

    study_history = []
    for i in range(7):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = db.query(Card).filter(
            Card.last_review >= day,
            Card.last_review < next_day
        ).count()
        study_history.append({"date": day.strftime("%Y-%m-%d"), "count": count})

    streak = _calculate_streak(db, today_start)

    mastery = {}
    decks = db.query(Card.deck_id).distinct().all()
    for (deck_id,) in decks:
        total_d = db.query(Card).filter(Card.deck_id == deck_id).count()
        mature_d = db.query(Card).filter(
            Card.deck_id == deck_id, Card.state >= 2, Card.stability >= 21
        ).count()
        mastery[deck_id] = round(mature_d / total_d, 3) if total_d > 0 else 0

    return {
        "total_cards": total,
        "cards_reviewed_today": reviewed_today,
        "daily_streak": streak,
        "due_cards": due,
        "mature_cards": mature,
        "young_cards": young,
        "new_cards": new_c,
        "study_history": study_history,
        "mastery_by_level": mastery,
    }


def _calculate_streak(db: Session, today_start: datetime) -> int:
    streak = 0
    current = today_start
    while True:
        next_day = current + timedelta(days=1)
        count = db.query(Card).filter(
            Card.last_review >= current,
            Card.last_review < next_day
        ).count()
        if count > 0:
            streak += 1
            current -= timedelta(days=1)
        else:
            break
    return streak
