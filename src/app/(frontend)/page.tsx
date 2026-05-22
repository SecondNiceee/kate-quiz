import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { QuizClient } from '@/components/quiz/QuizClient'

async function getSettings() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const { docs } = await payload.find({
      collection: 'quiz-settings',
      limit: 1,
    })

    if (docs.length === 0) {
      return {
        title: 'Опросник',
        description: 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
      }
    }

    return {
      title: docs[0].title || 'Опросник',
      description: docs[0].description || 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
    }
  } catch (error) {
    console.error('Error fetching quiz settings:', error)
    return {
      title: 'Опросник',
      description: 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
    }
  }
}

export default async function QuizPage() {
  const settings = await getSettings()

  return <QuizClient initialSettings={settings} />
}
