from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from datetime import datetime
from models.database import get_db
from models.db_models import Conversation, Message
from models.schemas import ChatRequest
from services.ollama_client import ollama_chat
from services.scenario_data import SCENARIO_PROMPTS, SCENARIO_INFO
import json

router = APIRouter()


@router.get("/scenarios")
def list_scenarios():
    result = []
    for sid, info in SCENARIO_INFO.items():
        result.append({
            "id": sid,
            "title": info["title"],
            "category": info["category"],
            "description": info["description"],
            "difficulty": info["difficulty"],
            "key_phrases": info["key_phrases"],
        })
    return result


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    info = SCENARIO_INFO.get(scenario_id)
    prompt = SCENARIO_PROMPTS.get(scenario_id)
    if not info or not prompt:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {**info, "id": scenario_id, "system_prompt": prompt}


@router.post("/conversation")
async def chat(data: ChatRequest, db: Session = Depends(get_db)):
    system_prompt = SCENARIO_PROMPTS.get(data.scenario_id)
    if not system_prompt:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scenario not found")

    if data.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == data.conversation_id).first()
        if not conv:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = Conversation(scenario_id=data.scenario_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    user_msg = Message(conversation_id=conv.id, role="user", content=data.message)
    db.add(user_msg)

    messages = [{"role": "system", "content": system_prompt}]
    history = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()
    for m in history:
        messages.append({"role": m.role, "content": m.content})

    try:
        result = await ollama_chat(messages)
        raw = result.get("message", {}).get("content", "")
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Ollama no está disponible: {e}")

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"reply": raw, "reply_reading": None, "reply_translation": None,
                  "correction": None, "suggestion": None}

    assistant_msg = Message(
        conversation_id=conv.id, role="assistant",
        content=parsed.get("reply", raw),
        translation=parsed.get("reply_translation")
    )
    db.add(assistant_msg)
    conv.updated_at = datetime.utcnow()
    db.commit()

    return {
        "conversation_id": conv.id,
        "reply": parsed.get("reply", raw),
        "reply_reading": parsed.get("reply_reading"),
        "reply_translation": parsed.get("reply_translation"),
        "correction": parsed.get("correction"),
        "suggestion": parsed.get("suggestion"),
    }


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()
    return {
        "id": conv.id,
        "scenario_id": conv.scenario_id,
        "created_at": conv.created_at.isoformat(),
        "messages": [{"role": m.role, "content": m.content, "translation": m.translation} for m in msgs],
    }
