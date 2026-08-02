import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Loan, TimelineEvent } from '../types'
import { calculateEmi } from '../lib/calculations'

const id = () => crypto.randomUUID()
const starter: Loan = { id: 'demo-loan', name: 'Dream Home', bankName: 'State Bank of India', loanType: 'floating', amount: 5_000_000, startDate: '2025-03-01', tenureMonths: 240, initialRate: 8.45, scheduledEmi: calculateEmi(5_000_000, 8.45, 240), actualEmi: calculateEmi(5_000_000, 8.45, 240), processingFee: 7500, insuranceCharges: 0 }
const starterEvents: TimelineEvent[] = [
  { id: 'rate-apr', type: 'rate-change', date: '2025-04-15', rate: 8.20 },
  { id: 'rate-dec', type: 'rate-change', date: '2025-12-01', rate: 7.70 },
  { id: 'prepay', type: 'prepayment', date: '2027-01-01', amount: 500000, strategy: 'reduce-tenure' }
]
export type ThemeMode = 'system' | 'light' | 'dark'
type Store = { loan: Loan; events: TimelineEvent[]; themeMode: ThemeMode; scenario: TimelineEvent[]; updateLoan: (x: Partial<Loan>) => void; addEvent: (e: Omit<TimelineEvent, 'id'>, scenario?: boolean) => void; removeEvent: (id: string, scenario?: boolean) => void; setThemeMode: (mode: ThemeMode) => void; clearScenario: () => void; importData: (data: { loan: Loan; events: TimelineEvent[] }) => void }
export const useLoanStore = create<Store>()(persist((set) => ({
  loan: starter, events: starterEvents, scenario: [], themeMode: 'system',
  updateLoan: x => set(s => ({ loan: { ...s.loan, ...x } })),
  addEvent: (e, scenario = false) => set(s => scenario ? { scenario: [...s.scenario, { ...e, id: id() }] } : { events: [...s.events, { ...e, id: id() }] }),
  removeEvent: (eventId, scenario = false) => set(s => scenario ? { scenario: s.scenario.filter(e => e.id !== eventId) } : { events: s.events.filter(e => e.id !== eventId) }),
  setThemeMode: themeMode => set({ themeMode }), clearScenario: () => set({ scenario: [] }),
  importData: data => set({ loan: data.loan, events: data.events, scenario: [] })
}), { name: 'loan-timeline-simulator', version: 2, migrate: persisted => {
  const state = persisted as Partial<Store> & { dark?: boolean }
  return { ...state, themeMode: state.themeMode ?? 'system' }
} }))
