import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const { docs } = await payload.find({
      collection: 'quiz-settings',
      limit: 1,
    })

    if (docs.length === 0) {
      // Create default settings if none exist
      const newSettings = await payload.create({
        collection: 'quiz-settings',
        data: {
          title: 'Опросник',
          description: 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
        },
      })
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(docs[0])
  } catch (error) {
    console.error('Error fetching quiz settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { title, description } = await request.json()

    const { docs } = await payload.find({
      collection: 'quiz-settings',
      limit: 1,
    })

    if (docs.length === 0) {
      // Create if doesn't exist
      const newSettings = await payload.create({
        collection: 'quiz-settings',
        data: { title, description },
      })
      return NextResponse.json(newSettings)
    }

    // Update existing
    const updated = await payload.update({
      collection: 'quiz-settings',
      id: docs[0].id,
      data: { title, description },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating quiz settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
