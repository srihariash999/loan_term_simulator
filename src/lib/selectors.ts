import type { Simulation } from '../types'
export const currentRow = (s: Simulation) => s.rows.find(r => r.closingBalance > 0) ?? s.rows.at(-1)
export const chartRows = (s: Simulation) => s.rows.map(r => ({ ...r, label: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), cumulativeInterest: s.rows.slice(0, r.month).reduce((a, b) => a + b.interest, 0) }))
