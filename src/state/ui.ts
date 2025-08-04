import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  ttsEnabled: boolean
  tutorialComplete: boolean
  toggleTTS: () => void
  setTutorialComplete: (complete: boolean) => void
  reset: () => void
}

const initialState = {
  ttsEnabled: false,
  tutorialComplete: false,
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleTTS: () => set((state) => ({ ttsEnabled: !state.ttsEnabled })),
      setTutorialComplete: (complete: boolean) => set({ tutorialComplete: complete }),
      reset: () => set(initialState),
    }),
    {
      name: 'sea-here-ui-state',
      partialize: (state) => ({
        ttsEnabled: state.ttsEnabled,
        tutorialComplete: state.tutorialComplete,
      }),
    }
  )
)
