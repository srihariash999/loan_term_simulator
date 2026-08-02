export type LoanType = 'floating' | 'fixed'
export type PrepaymentStrategy = 'reduce-tenure' | 'reduce-emi'
export type EventType = 'rate-change' | 'emi-change' | 'prepayment' | 'bank-charge' | 'insurance-charge' | 'top-up' | 'principal-reduction'

export interface Loan { id: string; name: string; bankName: string; loanType: LoanType; amount: number; startDate: string; tenureMonths: number; initialRate: number; scheduledEmi: number; actualEmi: number; processingFee: number; insuranceCharges: number }
export interface TimelineEvent { id: string; type: EventType; date: string; amount?: number; rate?: number; strategy?: PrepaymentStrategy; note?: string }
export interface ScheduleRow { month: number; date: string; openingBalance: number; interest: number; principal: number; emi: number; extraPayment: number; closingBalance: number; interestRate: number; eventIds: string[] }
export interface Simulation { rows: ScheduleRow[]; totalInterest: number; totalPrincipal: number; totalExtra: number; closureDate?: string; initialEmi: number; currentRate: number; isClosed: boolean }
