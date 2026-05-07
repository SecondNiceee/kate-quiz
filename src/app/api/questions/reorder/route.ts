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

    // Find current question index in the sorted array (ensure type match)
    const currentIndex = questions.findIndex((q) => Number(q.id) === Number(id))
    
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

    // Use actual array positions as new order_index values (not the potentially duplicate order_index from DB)
    // This ensures unique values even if all questions started with order_index = 0
    const newCurrentOrder = swapIndex
    const newSwapOrder = currentIndex

    // Update both questions with their new positions
    await sql`
      UPDATE quiz_questions SET order_index = ${newCurrentOrder} WHERE id = ${currentQuestion.id}
    `
    await sql`
      UPDATE quiz_questions SET order_index = ${newSwapOrder} WHERE id = ${swapQuestion.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}
