import { getPayload } from 'payload'
import config from '@payload-config'

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

// Helper function that executes raw SQL through Payload's database connection
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
    const payload = await getPayload({ config })
    const db = payload.db
    
    // Access the drizzle instance and execute raw SQL
    const result = await db.drizzle.execute({
      sql: query,
      params: values,
    })
    
    console.log('[DB] Query successful, rows returned:', Array.isArray(result) ? result.length : 0)
    return (Array.isArray(result) ? result : []) as T[]
  } catch (error) {
    console.error('[DB] Query failed:', error)
    throw error
  }
}
