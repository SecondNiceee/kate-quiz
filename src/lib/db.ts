import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

// Log connection status on initialization
console.log('[DB] Initializing PostgreSQL connection pool')
console.log('[DB] DATABASE_URL configured:', connectionString ? 'Yes' : 'No')

const pool = new Pool({
  connectionString,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err)
})

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL')
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

  console.log('[DB] Executing query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''))

  try {
    const result = await pool.query(query, values)
    console.log('[DB] Query successful, rows returned:', result.rows.length)
    return result.rows as T[]
  } catch (error) {
    console.error('[DB] Query failed:', error)
    throw error
  }
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
