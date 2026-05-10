from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter()

CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "curriculum")


def _load_json(filename: str) -> dict:
    path = os.path.join(CURRICULUM_DIR, filename)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/books")
def list_books():
    books = []
    for filename in ["minna_no_nihongo.json", "genki_i.json", "genki_ii.json"]:
        data = _load_json(filename)
        if data:
            books.append({
                "id": data.get("id", filename.replace(".json", "")),
                "title": data.get("title", filename),
                "description": data.get("description", ""),
                "lesson_count": len(data.get("lessons", [])),
            })
    return books


@router.get("/books/{book_id}")
def get_book(book_id: str):
    filename = f"{book_id}.json"
    data = _load_json(filename)
    if not data:
        raise HTTPException(status_code=404, detail="Book not found")
    return {
        "id": data["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "lessons": [
            {
                "id": l["id"],
                "title": l["title"],
                "grammar": l.get("grammar", []),
                "vocabulary_count": len(l.get("vocabulary", [])),
            }
            for l in data.get("lessons", [])
        ],
    }


@router.get("/books/{book_id}/lessons/{lesson_id}")
def get_lesson(book_id: str, lesson_id: str):
    filename = f"{book_id}.json"
    data = _load_json(filename)
    if not data:
        raise HTTPException(status_code=404, detail="Book not found")
    lesson = next((l for l in data.get("lessons", []) if l["id"] == lesson_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
