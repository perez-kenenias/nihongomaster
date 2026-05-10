'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, DashboardStats, Deck } from '@/lib/api';
import { BookOpen, Flame, Brain, Zap, TrendingUp, Hash } from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.stats.getDashboard().catch(() => null),
      api.study.getDecks().catch(() => []),
    ]).then(([s, d]) => {
      setStats(s);
      setDecks(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">おはようございます</h1>
          <p className="text-gray-400 mt-1">Sigue practicando, cada día cuenta.</p>
        </div>
        <Link href="/study" className="btn btn-primary">
          <Zap size={18} />
          Practicar ahora
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Flame} label="Racha" value={`${stats.daily_streak} días`} color="text-orange-400" />
          <StatCard icon={Brain} label="Revisados hoy" value={String(stats.cards_reviewed_today)} color="text-blue-400" />
          <StatCard icon={Hash} label="Pendientes" value={String(stats.due_cards)} color="text-red-400" />
          <StatCard icon={TrendingUp} label="Total tarjetas" value={String(stats.total_cards)} color="text-green-400" />
        </div>
      )}

      {stats && stats.study_history.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Historial de estudio</h2>
          <div className="flex items-end gap-1 h-24">
            {[...stats.study_history].reverse().map((d, i) => {
              const maxCount = Math.max(...stats.study_history.map((h) => h.count), 1);
              const height = (d.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-jp-accent rounded-t" style={{ height: `${Math.max(height, 4)}%`, opacity: d.count > 0 ? 0.9 : 0.15 }} />
                  <span className="text-[10px] text-gray-500">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Tus mazos</h2>
          <Link href="/curriculum" className="text-sm text-jp-accent hover:underline flex items-center gap-1">
            <BookOpen size={14} />
            Ver currículum
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">No tienes mazos todavía. ¡Importa tu primera lección!</p>
            <Link href="/curriculum" className="btn btn-primary inline-flex">
              Explorar currículum
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/study?deck=${deck.id}`}
                className="card flex items-center justify-between hover:border-jp-accent/30"
              >
                <div>
                  <h3 className="font-semibold">{deck.title}</h3>
                  <p className="text-sm text-gray-400">
                    {deck.source.replace(/_/g, ' ')} · Nivel {deck.level.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{deck.due_cards}</div>
                    <div className="text-gray-500 text-xs">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">{deck.new_cards}</div>
                    <div className="text-gray-500 text-xs">Nuevas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-300 font-semibold">{deck.card_count}</div>
                    <div className="text-gray-500 text-xs">Total</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`${color} bg-white/5 p-2.5 rounded-xl`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );
}
