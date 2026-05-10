from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class CardType(str, Enum):
    vocabulary = "vocabulary"
    grammar = "grammar"
    kanji = "kanji"
    sentence = "sentence"


class Textbook(str, Enum):
    minna_no_nihongo = "minna_no_nihongo"
    genki_i = "genki_i"
    genki_ii = "genki_ii"
    scenario = "scenario"
    custom = "custom"


class JLPTLevel(str, Enum):
    n5 = "n5"
    n4 = "n4"
    n3 = "n3"
    n2 = "n2"
    n1 = "n1"


class ScenarioCategory(str, Enum):
    restaurant = "restaurant"
    airport = "airport"
    cafe = "cafe"
    interview = "interview"
    konbini = "konbini"
    hospital = "hospital"
    school = "school"
    station = "station"


class Rating(str, Enum):
    again = "again"
    hard = "hard"
    good = "good"
    easy = "easy"


class CardCreate(BaseModel):
    front: str
    back: str
    reading: str = ""
    card_type: CardType = CardType.vocabulary
    example_sentence: Optional[str] = None
    deck_id: str


class CardResponse(BaseModel):
    id: str
    front: str
    back: str
    reading: str
    card_type: CardType
    example_sentence: Optional[str]
    deck_id: str
    stability: float
    difficulty: float
    last_review: Optional[datetime]
    next_review: Optional[datetime]
    reps: int
    lapses: int
    state: int

    class Config:
        from_attributes = True


class DeckCreate(BaseModel):
    title: str
    source: Textbook = Textbook.custom
    level: JLPTLevel = JLPTLevel.n5


class DeckResponse(BaseModel):
    id: str
    title: str
    source: Textbook
    level: JLPTLevel
    card_count: int
    new_cards: int
    due_cards: int

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    card_id: str
    rating: Rating


class ReviewResponse(BaseModel):
    card_id: str
    stability: float
    difficulty: float
    next_review: datetime


class SessionRequest(BaseModel):
    deck_id: str
    limit: int = 20


class ChatRequest(BaseModel):
    scenario_id: str
    message: str
    conversation_id: Optional[str] = None
    mode: str = "text"


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    reply_reading: Optional[str] = None
    reply_translation: Optional[str] = None
    correction: Optional[str] = None
    suggestion: Optional[str] = None


class PronunciationRequest(BaseModel):
    text: str
    transcription: str


class PronunciationResponse(BaseModel):
    score: float
    feedback: str
    phoneme_scores: List[dict] = []


class ScenarioResponse(BaseModel):
    id: str
    title: str
    category: ScenarioCategory
    description: str
    difficulty: int
    key_phrases: List[str]


class LessonSummary(BaseModel):
    id: str
    title: str
    grammar: List[str]
    vocabulary_count: int


class StatsResponse(BaseModel):
    total_cards: int
    cards_reviewed_today: int
    daily_streak: int
    due_cards: int
    mature_cards: int
    young_cards: int
    new_cards: int
    study_history: List[dict]
    mastery_by_level: dict
