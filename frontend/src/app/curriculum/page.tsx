'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Book, Deck } from '@/lib/api';
import { BookOpen, ChevronRight, Download } from 'lucide-react';

export default function CurriculumPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.curriculum.getBooks().catch(() => []),
      api.study.getDecks().catch(() => []),
    ]).then(([b, d]) => {
      setBooks(b);
      setDecks(d);
      setLoading(false);
    });
  }, []);

  const importLesson = async (bookId: string, lessonId: string, lessonTitle: string) => {
    setImporting(lessonId);
    try {
      const lesson = await api.curriculum.getLesson(bookId, lessonId);
      const deck = await api.study.createDeck({
        title: lessonTitle,
        source: bookId,
        level: 'n5',
      });
      for (const v of lesson.vocabulary) {
        await api.study.addCard(deck.id, {
          front: v.kanji,
          back: v.es,
          reading: v.kana,
          card_type: 'vocabulary',
          deck_id: deck.id,
        });
      }
      for (const s of lesson.sentences) {
        await api.study.addCard(deck.id, {
          front: s.jp,
          back: s.es,
          card_type: 'sentence',
          deck_id: deck.id,
        });
      }
      const updatedDecks = await api.study.getDecks();
      setDecks(updatedDecks);
      setMessage(`Lección "${lessonTitle}" importada con éxito`);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al importar la lección');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setImporting(null);
    }
  };

  const isDeckImported = (lessonTitle: string) => decks.some((d) => d.title === lessonTitle);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Currículum</h1>
        <p className="text-gray-400 mt-1">Basado en Minna no Nihongo y Genki</p>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {books.map((book) => (
          <BookSection
            key={book.id}
            book={book}
            importing={importing}
            isDeckImported={isDeckImported}
            onImport={importLesson}
          />
        ))}
      </div>
    </div>
  );
}

function BookSection({
  book,
  importing,
  isDeckImported,
  onImport,
}: {
  book: Book;
  importing: string | null;
  isDeckImported: (title: string) => boolean;
  onImport: (bookId: string, lessonId: string, title: string) => void;
}) {
  const [lessons, setLessons] = useState<{ id: string; title: string; grammar: string[]; vocabulary_count: number }[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded && lessons.length === 0) {
      api.curriculum.getBook(book.id).then((b) => setLessons(b.lessons)).catch(() => {});
    }
  }, [expanded, book.id, lessons.length]);

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-jp-accent" />
          <div>
            <h3 className="font-bold text-lg">{book.title}</h3>
            <p className="text-sm text-gray-400">{book.lesson_count} lecciones · {book.description}</p>
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
          {lessons.length === 0 ? (
            <div className="animate-spin w-6 h-6 border-2 border-jp-accent border-t-transparent rounded-full mx-auto" />
          ) : (
            lessons.map((lesson) => {
              const imported = isDeckImported(lesson.title);
              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  <div>
                    <span className="font-medium">{lesson.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {lesson.vocabulary_count} palabras · {lesson.grammar.length} gramática
                    </span>
                  </div>
                  {imported ? (
                    <Link
                      href={`/study?deck=${lesson.id}`}
                      className="text-sm text-green-400 hover:underline flex items-center gap-1"
                    >
                      Estudiar <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => onImport(book.id, lesson.id, lesson.title)}
                      disabled={importing === lesson.id}
                      className="btn btn-secondary text-xs py-1.5 px-3"
                    >
                      <Download size={14} />
                      {importing === lesson.id ? 'Importando...' : 'Importar'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
