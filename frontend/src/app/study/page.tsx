'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, Card, Deck } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';
import Flashcard from '@/components/Flashcard';

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    }>
      <StudyContent />
    </Suspense>
  );
}

function StudyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckId = searchParams.get('deck');

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.study.getDecks().then(setDecks).catch(() => {});
  }, []);

  useEffect(() => {
    if (!deckId || decks.length === 0) return;
    const d = decks.find((x) => x.id === deckId);
    setSelectedDeck(d || null);
    if (d) {
      setLoading(true);
      api.study.startSession(d.id, 20)
        .then((c) => { setCards(c); setCurrentIndex(0); setSessionDone(c.length === 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [deckId, decks]);

  const handleReview = useCallback((cardId: string, rating: string) => {
    api.study.review(cardId, rating).catch(() => {});
    setReviewedCount((c) => c + 1);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSessionDone(true);
    }
  }, [currentIndex, cards.length]);

  if (!deckId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-4">Selecciona un mazo para estudiar</h1>
        <div className="grid gap-3">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => router.push(`/study?deck=${d.id}`)}
              className="card text-left hover:border-jp-accent/30"
            >
              <h3 className="font-semibold">{d.title}</h3>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-400">{d.due_cards} pendientes</span>
                <span className="text-blue-400">{d.new_cards} nuevas</span>
                <span className="text-gray-400">{d.card_count} total</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/study')} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{selectedDeck?.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="progress-bar flex-1 max-w-xs">
              <div
                className="progress-fill"
                style={{ width: `${cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {currentIndex + 1}/{cards.length}
            </span>
          </div>
        </div>
      </div>

      {sessionDone ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">¡Sesión completada!</h2>
          <p className="text-gray-400 mb-6">Has repasado {reviewedCount} tarjetas.</p>
          <button
            onClick={() => {
              api.study.startSession(deckId, 20)
                .then((c) => { setCards(c); setCurrentIndex(0); setSessionDone(c.length === 0); setReviewedCount(0); })
                .catch(() => {});
            }}
            className="btn btn-primary"
          >
            Nueva sesión
          </button>
        </div>
      ) : cards.length > 0 ? (
        <Flashcard card={cards[currentIndex]} onReview={handleReview} />
      ) : (
        <div className="card text-center py-16">
          <h2 className="text-xl font-bold mb-2">¡No hay tarjetas pendientes!</h2>
          <p className="text-gray-400">Vuelve más tarde o añade nuevas tarjetas.</p>
        </div>
      )}
    </div>
  );
}
