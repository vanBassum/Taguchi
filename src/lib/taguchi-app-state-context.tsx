import { createContext, type ReactNode, useContext } from "react"

import type { useTaguchiAppState } from "@/lib/use-taguchi-app-state"

type TaguchiAppState = ReturnType<typeof useTaguchiAppState>

const TaguchiAppStateContext = createContext<TaguchiAppState | null>(null)

type TaguchiAppStateProviderProps = {
  value: TaguchiAppState
  children: ReactNode
}

export function TaguchiAppStateProvider({ value, children }: TaguchiAppStateProviderProps) {
  return <TaguchiAppStateContext.Provider value={value}>{children}</TaguchiAppStateContext.Provider>
}

export function useTaguchiAppStateContext(): TaguchiAppState {
  const context = useContext(TaguchiAppStateContext)

  if (!context) {
    throw new Error("useTaguchiAppStateContext must be used within TaguchiAppStateProvider")
  }

  return context
}