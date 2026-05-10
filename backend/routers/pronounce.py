from fastapi import APIRouter
from models.schemas import PronunciationRequest, PronunciationResponse
from services.pronunciation_scorer import score_pronunciation

router = APIRouter()


@router.post("/score", response_model=PronunciationResponse)
def score(data: PronunciationRequest):
    result = score_pronunciation(data.text, data.transcription)
    return PronunciationResponse(**result)
