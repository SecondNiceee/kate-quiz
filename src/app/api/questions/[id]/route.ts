import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { id } = await params

    const body = await request.json()
    const { question_text, question_type, options, units, is_required } = body

    await payload.update({
      collection: 'quiz-questions',
      id,
      data: {
        questionText: question_text,
        questionType: question_type,
        options,
        units,
        isRequired: is_required,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { id } = await params

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
