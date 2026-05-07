import { sql, type QuizQuestion } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const questions = await sql`
      SELECT * FROM quiz_questions ORDER BY order_index ASC, id ASC
    `
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question_text, question_type, options = [], units = [], is_required = true } = body

    // Get the max order_index to place new question at the end
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(order_index), -1) as max_order FROM quiz_questions
    `
    const newOrderIndex = (maxOrderResult[0]?.max_order ?? -1) + 1

    const result = await sql`
      INSERT INTO quiz_questions (question_text, question_type, options, units, order_index, is_required)
      VALUES (${question_text}, ${question_type}, ${JSON.stringify(options)}, ${JSON.stringify(units)}, ${newOrderIndex}, ${is_required})
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, question_text, question_type, options = [], units = [], order_index, is_required } = body

    const result = await sql`
      UPDATE quiz_questions 
      SET question_text = ${question_text}, 
          question_type = ${question_type}, 
          options = ${JSON.stringify(options)}, 
          units = ${JSON.stringify(units)},
          order_index = ${order_index},
          is_required = ${is_required},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await sql`DELETE FROM quiz_questions WHERE id = ${parseInt(id)}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
