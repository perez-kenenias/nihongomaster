'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, MessageCircle, Mic, BarChart3, Settings, Home, Hash } from 'lucide-react';

const links = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/curriculum', label: 'Currículum', icon: BookOpen },
  { href: '/study', label: 'Estudio', icon: Hash },
  { href: '/scenarios', label: 'Escenarios', icon: MessageCircle },
  { href: '/pronounce', label: 'Pronunciar', icon: Mic },
  { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { href: '/settings', label: 'Ajustes', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/5 bg-[#0d0d17] sticky top-0 z-50 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="text-jp-red">日本</span>
          <span className="text-white">Nihongo</span>
          <span className="text-jp-accent">Master</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-jp-accent/15 text-jp-accent'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="md:hidden flex items-center gap-2 overflow-x-auto">
          {links.slice(0, 5).map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            const Icon = l.icon;
            if (l.href === '/') return null;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] ${
                  active ? 'text-jp-accent' : 'text-gray-500'
                }`}
              >
                <Icon size={18} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
