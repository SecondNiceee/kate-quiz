import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { questions } = await request.json()
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid questions array' },
        { status: 400 }
      )
    }

    // Update all questions in a single transaction
    for (const q of questions) {
      await sql`
        UPDATE quiz_questions 
        SET order_index = ${q.order_index} 
        WHERE id = ${q.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json(
      { error: 'Failed to reorder questions' },
      { status: 500 }
    )
  }
}
