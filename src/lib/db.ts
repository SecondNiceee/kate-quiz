import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Helper function that mimics the neon() tagged template syntax
export async function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  // Build the query with $1, $2, etc. placeholders
  let query = ''
  strings.forEach((str, i) => {
    query += str
    if (i < values.length) {
      query += `$${i + 1}`
    }
  })

  const result = await pool.query(query, values)
  return result.rows as T[]
}

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
