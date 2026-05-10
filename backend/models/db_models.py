from __future__ import annotations
import uuid
import math
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from models.database import Base, get_db


def generate_id():
    return str(uuid.uuid4())


class Deck(Base):
    __tablename__ = "decks"

    id = Column(String, primary_key=True, default=generate_id)
    title = Column(String, nullable=False)
    source = Column(String, default="custom")
    level = Column(String, default="n5")
    created_at = Column(DateTime, default=datetime.utcnow)

    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=generate_id)
    front = Column(String, nullable=False)
    back = Column(String, nullable=False)
    reading = Column(String, default="")
    card_type = Column(String, default="vocabulary")
    example_sentence = Column(String, nullable=True)
    deck_id = Column(String, ForeignKey("decks.id"), nullable=False)
    stability = Column(Float, default=0.0)
    difficulty = Column(Float, default=0.0)
    last_review = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=True)
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    state = Column(Integer, default=0)

    deck = relationship("Deck", back_populates="cards")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_id)
    scenario_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_id)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    translation = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
