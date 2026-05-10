'use client';

import { create } from 'zustand';

interface AppState {
  selectedDeckId: string | null;
  setSelectedDeck: (id: string | null) => void;
  isStudying: boolean;
  setStudying: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDeckId: null,
  setSelectedDeck: (id) => set({ selectedDeckId: id }),
  isStudying: false,
  setStudying: (v) => set({ isStudying: v }),
}));
