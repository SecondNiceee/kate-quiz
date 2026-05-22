import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()
    const { id, direction } = body

    if (!id || !direction || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Get all questions ordered by orderIndex
    const { docs } = await payload.find({
      collection: 'quiz-questions',
      sort: 'orderIndex',
      limit: 1000,
    })

    // Find current question index in the sorted array
    const currentIndex = docs.findIndex((q) => String(q.id) === String(id))

    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Calculate swap index
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Check boundaries
    if (swapIndex < 0 || swapIndex >= docs.length) {
      return NextResponse.json({ error: 'Cannot move further' }, { status: 400 })
    }

    const currentQuestion = docs[currentIndex]
    const swapQuestion = docs[swapIndex]

    // Swap order indices
    await payload.update({
      collection: 'quiz-questions',
      id: currentQuestion.id,
      data: { orderIndex: swapIndex },
    })

    await payload.update({
      collection: 'quiz-questions',
      id: swapQuestion.id,
      data: { orderIndex: currentIndex },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}
