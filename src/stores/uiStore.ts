import { create } from 'zustand'

type UiStore = {
  message: string
  error: string
  setMessage: (message: string) => void
  setError: (error: string) => void
  clearStatus: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  message: '',
  error: '',
  setMessage: (message) => set({ message, error: '' }),
  setError: (error) => set({ error, message: '' }),
  clearStatus: () => set({ message: '', error: '' })
}))
