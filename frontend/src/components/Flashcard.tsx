'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/lib/api';
import { Volume2 } from 'lucide-react';

interface Props {
  card: Card;
  onReview: (cardId: string, rating: string) => void;
}

export default function Flashcard({ card, onReview }: Props) {
  const [flipped, setFlipped] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <div
        onClick={() => { if (!flipped) { setFlipped(true); speak(card.front); } }}
        className="card min-h-[280px] flex flex-col items-center justify-center cursor-pointer select-none hover:border-jp-accent/30"
      >
        {!flipped ? (
          <>
            <p className="text-5xl font-jp font-bold mb-4 text-center">{card.front}</p>
            {card.reading && (
              <p className="text-lg text-gray-400 font-jp mb-2">{card.reading}</p>
            )}
            <p className="text-xs text-gray-600 mt-4">Toca para revelar</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold mb-2 text-center">{card.back}</p>
            {card.reading && (
              <p className="text-lg text-gray-400 font-jp mb-3">{card.reading}</p>
            )}
            {card.example_sentence && (
              <p className="text-sm text-gray-500 font-jp text-center italic mb-4 max-w-sm">
                {card.example_sentence}
              </p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); speak(card.front); }}
              className="btn btn-secondary text-sm mb-4"
            >
              <Volume2 size={16} />
              Escuchar
            </button>
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
              {card.card_type}
            </span>
          </>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button onClick={() => onReview(card.id, 'again')} className="btn btn-srs srs-again">
            Again
          </button>
          <button onClick={() => onReview(card.id, 'hard')} className="btn btn-srs srs-hard">
            Hard
          </button>
          <button onClick={() => onReview(card.id, 'good')} className="btn btn-srs srs-good">
            Good
          </button>
          <button onClick={() => onReview(card.id, 'easy')} className="btn btn-srs srs-easy">
            Easy
          </button>
        </div>
      )}

      <div className="mt-3 text-center text-xs text-gray-600">
        Estado: {card.state >= 2 ? 'Madura' : card.state === 1 ? 'Aprendiendo' : 'Nueva'} ·
        Reps: {card.reps} ·
        Int: {card.stability.toFixed(1)}d
      </div>
    </div>
  );
}
