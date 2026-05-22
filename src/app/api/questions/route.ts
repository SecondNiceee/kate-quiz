import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const { docs } = await payload.find({
      collection: 'quiz-questions',
      sort: 'orderIndex',
      limit: 1000,
    })

    // Transform to match expected format
    const questions = docs.map((doc) => ({
      id: doc.id,
      question_text: doc.questionText,
      question_type: doc.questionType,
      options: doc.options || [],
      units: doc.units || [],
      order_index: doc.orderIndex,
      is_required: doc.isRequired,
    }))

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()
    const { question_text, question_type, options = [], units = [], is_required = true } = body

    // Get the max order_index to place new question at the end
    const { docs } = await payload.find({
      collection: 'quiz-questions',
      sort: '-orderIndex',
      limit: 1,
    })

    const newOrderIndex = docs.length > 0 ? (docs[0].orderIndex || 0) + 1 : 0

    const result = await payload.create({
      collection: 'quiz-questions',
      data: {
        questionText: question_text,
        questionType: question_type,
        options,
        units,
        orderIndex: newOrderIndex,
        isRequired: is_required,
      },
    })

    return NextResponse.json({
      id: result.id,
      question_text: result.questionText,
      question_type: result.questionType,
      options: result.options,
      units: result.units,
      order_index: result.orderIndex,
      is_required: result.isRequired,
    })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()
    const { id, question_text, question_type, options = [], units = [], order_index, is_required } = body

    const result = await payload.update({
      collection: 'quiz-questions',
      id,
      data: {
        questionText: question_text,
        questionType: question_type,
        options,
        units,
        orderIndex: order_index,
        isRequired: is_required,
      },
    })

    return NextResponse.json({
      id: result.id,
      question_text: result.questionText,
      question_type: result.questionType,
      options: result.options,
      units: result.units,
      order_index: result.orderIndex,
      is_required: result.isRequired,
    })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await payload.delete({
      collection: 'quiz-questions',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
