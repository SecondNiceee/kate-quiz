import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { questions } = await request.json()

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions array' }, { status: 400 })
    }

    // Update all questions
    for (const q of questions) {
      await payload.update({
        collection: 'quiz-questions',
        id: q.id,
        data: { orderIndex: q.order_index },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering questions:', error)
    return NextResponse.json({ error: 'Failed to reorder questions' }, { status: 500 })
  }
}
