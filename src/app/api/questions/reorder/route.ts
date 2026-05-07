import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, direction } = body

    if (!id || !direction || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Get all questions ordered by order_index
    const questions = await sql`
      SELECT id, order_index FROM quiz_questions ORDER BY order_index ASC, id ASC
    `

    // Find current question index in the sorted array
    const currentIndex = questions.findIndex((q) => q.id === id)
    
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Calculate swap index
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Check boundaries
    if (swapIndex < 0 || swapIndex >= questions.length) {
      return NextResponse.json({ error: 'Cannot move further' }, { status: 400 })
    }

    const currentQuestion = questions[currentIndex]
    const swapQuestion = questions[swapIndex]

    // Swap order_index values
    await sql`
      UPDATE quiz_questions SET order_index = ${swapQuestion.order_index} WHERE id = ${currentQuestion.id}
    `
    await sql`
      UPDATE quiz_questions SET order_index = ${currentQuestion.order_index} WHERE id = ${swapQuestion.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}
