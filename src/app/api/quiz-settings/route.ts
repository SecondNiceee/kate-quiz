import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_settings (
      id serial PRIMARY KEY,
      title text NOT NULL DEFAULT 'Опросник',
      description text NOT NULL DEFAULT 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
      updated_at timestamp DEFAULT NOW()
    )
  `
  const rows = await sql`SELECT id FROM quiz_settings LIMIT 1`
  if (rows.length === 0) {
    await sql`
      INSERT INTO quiz_settings (title, description)
      VALUES ('Опросник', 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.')
    `
  }
}

export async function GET() {
  try {
    await ensureTable()
    const rows = await sql`SELECT * FROM quiz_settings LIMIT 1`
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error fetching quiz settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTable()
    const { title, description } = await request.json()
    const rows = await sql`
      UPDATE quiz_settings
      SET title = ${title}, description = ${description}, updated_at = NOW()
      WHERE id = (SELECT id FROM quiz_settings LIMIT 1)
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating quiz settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
