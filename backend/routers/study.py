from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from models.database import get_db
from models.db_models import Deck, Card
from models.schemas import (
    CardCreate, CardResponse, DeckCreate, DeckResponse,
    ReviewRequest, ReviewResponse, SessionRequest
)
from services.srs_engine import review_card, get_due_cards_query, init_card

router = APIRouter()


@router.get("/decks", response_model=List[DeckResponse])
def list_decks(db: Session = Depends(get_db)):
    decks = db.query(Deck).all()
    result = []
    now = datetime.utcnow()
    for d in decks:
        total = db.query(Card).filter(Card.deck_id == d.id).count()
        new_c = db.query(Card).filter(Card.deck_id == d.id, Card.next_review == None).count()
        due_c = db.query(Card).filter(
            Card.deck_id == d.id,
            Card.next_review != None,
            Card.next_review <= now
        ).count()
        result.append(DeckResponse(
            id=d.id, title=d.title, source=d.source, level=d.level,
            card_count=total, new_cards=new_c, due_cards=due_c
        ))
    return result


@router.post("/decks", response_model=DeckResponse)
def create_deck(data: DeckCreate, db: Session = Depends(get_db)):
    deck = Deck(title=data.title, source=data.source.value, level=data.level.value)
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return DeckResponse(
        id=deck.id, title=deck.title, source=deck.source, level=deck.level,
        card_count=0, new_cards=0, due_cards=0
    )


@router.delete("/decks/{deck_id}")
def delete_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()
    return {"ok": True}


@router.post("/decks/{deck_id}/cards", response_model=CardResponse)
def add_card(deck_id: str, data: CardCreate, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    initial = init_card()
    card = Card(
        front=data.front, back=data.back, reading=data.reading,
        card_type=data.card_type.value, example_sentence=data.example_sentence,
        deck_id=deck_id,
        stability=initial["stability"], difficulty=initial["difficulty"],
        state=initial["state"]
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return _card_response(card)


@router.get("/decks/{deck_id}/cards", response_model=List[CardResponse])
def list_cards(deck_id: str, db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    return [_card_response(c) for c in cards]


@router.post("/session", response_model=List[CardResponse])
def start_session(data: SessionRequest, db: Session = Depends(get_db)):
    cards = get_due_cards_query(db, data.deck_id, data.limit)
    return [_card_response(c) for c in cards]


@router.post("/review", response_model=ReviewResponse)
def submit_review(data: ReviewRequest, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    result = review_card(
        stability=card.stability,
        difficulty=card.difficulty,
        state=card.state,
        rating=data.rating.value
    )

    card.stability = result["stability"]
    card.difficulty = result["difficulty"]
    card.next_review = result["next_review"]
    card.state = result["state"]
    card.last_review = datetime.utcnow()
    card.reps += 1
    if data.rating.value == "again":
        card.lapses += 1

    db.commit()
    return ReviewResponse(
        card_id=card.id,
        stability=card.stability,
        difficulty=card.difficulty,
        next_review=card.next_review
    )


@router.delete("/cards/{card_id}")
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"ok": True}


def _card_response(c: Card) -> CardResponse:
    return CardResponse(
        id=c.id, front=c.front, back=c.back, reading=c.reading or "",
        card_type=c.card_type, example_sentence=c.example_sentence,
        deck_id=c.deck_id, stability=c.stability, difficulty=c.difficulty,
        last_review=c.last_review, next_review=c.next_review,
        reps=c.reps, lapses=c.lapses, state=c.state
    )
