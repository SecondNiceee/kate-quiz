'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Questions } from '@/components/quiz/Questions'

type QuestionData = {
  id: number
  question_text: string
  question_type: string
  options: string[]
  units: string[]
  is_required: boolean
}

type QuizSettings = {
  title: string
  description: string
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState<QuizSettings>({
    title: 'Опросник',
    description: 'Пожалуйста, ответьте на все вопросы ниже. Ваши ответы помогут нам лучше понять ваши потребности.',
  })

  useEffect(() => {
    fetchQuestions()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/quiz-settings')
      const data = await response.json()
      if (data && data.title) setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers({
      ...answers,
      [questionId]: value
    })
  }

  const handleSubmit = () => {
    // Validate required questions
    const missingAnswers = questions
      .filter(q => q.is_required && !answers[q.id])
      .map(q => q.question_text)

    if (missingAnswers.length > 0) {
      alert(`Пожалуйста, ответьте на все обязательные вопросы:\n${missingAnswers.join('\n')}`)
      return
    }

    // Data is not sent anywhere per user's request
    console.log('[v0] Quiz submitted with answers:', answers)
    setSubmitted(true)

    // Show success message
    setTimeout(() => {
      setSubmitted(false)
      setAnswers({})
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {settings.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            {settings.description}
          </p>
        </div>

        {loading ? (
          <Card className="p-12 text-center shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Загрузка вопросов...</p>
            </div>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-600 mb-2 text-lg">Вопросов еще не добавлено</p>
            <p className="text-sm text-slate-500">
              Перейдите в{' '}
              <a href="/new-admin" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                админ-панель
              </a>
              , чтобы добавить вопросы
            </p>
          </Card>
        ) : (
          <>
            <Questions
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
            />

            {/* Submit Button */}
            <div className="mt-10 flex justify-center">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
              >
                Отправить ответы
              </Button>
            </div>

            {submitted && (
              <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
                <p className="font-semibold text-lg">Спасибо за прохождение опросника!</p>
                <p className="text-sm mt-1 text-green-600">Ваши ответы были получены.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
