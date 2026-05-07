import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export { sql }

export type QuestionType = 'single' | 'multiple' | 'text' | 'number' | 'date' | 'time'

export interface QuizQuestion {
  id: number
  question_text: string
  question_type: QuestionType
  options: string[]
  units: string[]
  order_index: number
  is_required: boolean
  created_at: string
  updated_at: string
}
