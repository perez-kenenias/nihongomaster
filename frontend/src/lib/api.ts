const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export interface Card {
  id: string;
  front: string;
  back: string;
  reading: string;
  card_type: string;
  example_sentence: string | null;
  deck_id: string;
  stability: number;
  difficulty: number;
  last_review: string | null;
  next_review: string | null;
  reps: number;
  lapses: number;
  state: number;
}

export interface Deck {
  id: string;
  title: string;
  source: string;
  level: string;
  card_count: number;
  new_cards: number;
  due_cards: number;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: number;
  key_phrases: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  translation?: string;
}

export interface DashboardStats {
  total_cards: number;
  cards_reviewed_today: number;
  daily_streak: number;
  due_cards: number;
  mature_cards: number;
  young_cards: number;
  new_cards: number;
  study_history: { date: string; count: number }[];
  mastery_by_level: Record<string, number>;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  lesson_count: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  grammar: string[];
  vocabulary_count: number;
}

export interface Lesson {
  id: string;
  title: string;
  grammar: string[];
  vocabulary: { kanji: string; kana: string; es: string }[];
  sentences: { jp: string; es: string }[];
}

export const api = {
  study: {
    getDecks: () => fetchApi<Deck[]>("/study/decks"),
    createDeck: (data: { title: string; source: string; level: string }) =>
      fetchApi<Deck>("/study/decks", { method: "POST", body: JSON.stringify(data) }),
    deleteDeck: (id: string) =>
      fetchApi<{ ok: boolean }>(`/study/decks/${id}`, { method: "DELETE" }),
    getCards: (deckId: string) =>
      fetchApi<Card[]>(`/study/decks/${deckId}/cards`),
    addCard: (deckId: string, data: Partial<Card>) =>
      fetchApi<Card>(`/study/decks/${deckId}/cards`, { method: "POST", body: JSON.stringify(data) }),
    deleteCard: (id: string) =>
      fetchApi<{ ok: boolean }>(`/study/cards/${id}`, { method: "DELETE" }),
    startSession: (deckId: string, limit = 20) =>
      fetchApi<Card[]>("/study/session", { method: "POST", body: JSON.stringify({ deck_id: deckId, limit }) }),
    review: (cardId: string, rating: string) =>
      fetchApi<{ card_id: string; stability: number; difficulty: number; next_review: string }>(
        "/study/review",
        { method: "POST", body: JSON.stringify({ card_id: cardId, rating }) }
      ),
  },
  curriculum: {
    getBooks: () => fetchApi<Book[]>("/curriculum/books"),
    getBook: (id: string) => fetchApi<{ id: string; title: string; description: string; lessons: LessonSummary[] }>(`/curriculum/books/${id}`),
    getLesson: (bookId: string, lessonId: string) => fetchApi<Lesson>(`/curriculum/books/${bookId}/lessons/${lessonId}`),
  },
  chat: {
    getScenarios: () => fetchApi<Scenario[]>("/chat/scenarios"),
    getScenario: (id: string) => fetchApi<Scenario & { system_prompt: string }>(`/chat/scenarios/${id}`),
    sendMessage: (data: { scenario_id: string; message: string; conversation_id?: string; mode?: string }) =>
      fetchApi<{ conversation_id: string; reply: string; reply_reading?: string; reply_translation?: string; correction?: string; suggestion?: string }>(
        "/chat/conversation", { method: "POST", body: JSON.stringify(data) }
      ),
    getConversation: (id: string) => fetchApi<{ id: string; scenario_id: string; created_at: string; messages: ChatMessage[] }>(`/chat/conversations/${id}`),
  },
  pronounce: {
    score: (text: string, transcription: string) =>
      fetchApi<{ score: number; feedback: string; phoneme_scores: { char: string; score: number; status: string }[] }>(
        "/pronounce/score", { method: "POST", body: JSON.stringify({ text, transcription }) }
      ),
  },
  stats: {
    getDashboard: () => fetchApi<DashboardStats>("/stats/dashboard"),
  },
};
