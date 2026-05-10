'use client';

import { useEffect, useState } from 'react';
import { api, DashboardStats } from '@/lib/api';
import { Flame, Brain, Hash, TrendingUp, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.getDashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">No hay datos todavía. ¡Empieza a estudiar!</p>
      </div>
    );
  }

  const total = stats.total_cards || 1;
  const completed = stats.mature_cards || 0;
  const mastery = Math.round((completed / total) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-gray-400 mt-1">Tu progreso de aprendizaje</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Racha" value={`${stats.daily_streak} días`} color="text-orange-400" />
        <StatCard icon={Brain} label="Hoy" value={String(stats.cards_reviewed_today)} color="text-blue-400" />
        <StatCard icon={Hash} label="Pendientes" value={String(stats.due_cards)} color="text-red-400" />
        <StatCard icon={TrendingUp} label="Total" value={String(stats.total_cards)} color="text-green-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Dominio general</h2>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#e94560" strokeWidth="8"
                  strokeDasharray={`${(mastery / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{mastery}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <ProgressRow icon={CheckCircle2} label="Maduras" value={stats.mature_cards} total={total} color="bg-green-500" />
            <ProgressRow icon={Clock} label="En aprendizaje" value={stats.young_cards} total={total} color="bg-blue-500" />
            <ProgressRow icon={Sparkles} label="Nuevas" value={stats.new_cards} total={total} color="bg-purple-500" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Historial (7 días)</h2>
          <div className="flex items-end gap-1.5 h-32">
            {[...stats.study_history].reverse().map((d, i) => {
              const maxCount = Math.max(...stats.study_history.map((h) => h.count), 1);
              const height = (d.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-jp-accent rounded-t transition-all"
                    style={{ height: `${Math.max(height, 3)}%`, opacity: d.count > 0 ? 0.9 : 0.12 }}
                  />
                  <span className="text-[10px] text-gray-500">{d.date.slice(5)}</span>
                  <span className="text-[10px] text-gray-600">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {Object.keys(stats.mastery_by_level).length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Dominio por mazo</h2>
          <div className="space-y-3">
            {Object.entries(stats.mastery_by_level).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 truncate max-w-[200px]">{key}</span>
                  <span className="text-gray-500">{Math.round(val * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${val * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

function ProgressRow({ icon: Icon, label, value, total, color }: { icon: React.ElementType; label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400 flex items-center gap-1.5">
          <Icon size={14} />
          {label}
        </span>
        <span className="text-gray-300">{value}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
