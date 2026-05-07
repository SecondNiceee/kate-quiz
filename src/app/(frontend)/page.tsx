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

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Опросник</h1>
          <p className="text-gray-600">Пожалуйста, ответьте на все вопросы</p>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">Загрузка вопросов...</p>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-2">Вопросов еще не добавлено</p>
            <p className="text-sm text-gray-500">
              Перейдите в <a href="/new-admin" className="text-purple-600 hover:underline">админ-панель</a>, чтобы добавить вопросы
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
            <div className="mt-8 flex gap-4">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Отправить ответы
              </Button>
            </div>

            {submitted && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
                <p className="font-semibold">✓ Спасибо за прохождение опросника!</p>
                <p className="text-sm mt-1">Ваши ответы были получены.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
