'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Questions } from '@/components/quiz/Questions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

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
  const router = useRouter()
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [errorQuestionIds, setErrorQuestionIds] = useState<number[]>([])
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [missingQuestions, setMissingQuestions] = useState<string[]>([])
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
    // Remove from error list when answered
    if (errorQuestionIds.includes(questionId)) {
      setErrorQuestionIds(errorQuestionIds.filter(id => id !== questionId))
    }
  }

  const handleSubmit = () => {
    // Validate required questions
    const unansweredRequired = questions.filter(q => {
      if (!q.is_required) return false
      const answer = answers[q.id]
      if (answer === undefined || answer === null || answer === '') return true
      if (Array.isArray(answer) && answer.length === 0) return true
      if (typeof answer === 'object' && !Array.isArray(answer) && !answer.value) return true
      return false
    })

    if (unansweredRequired.length > 0) {
      setErrorQuestionIds(unansweredRequired.map(q => q.id))
      setMissingQuestions(unansweredRequired.map(q => q.question_text))
      setShowErrorModal(true)
      return
    }

    // Navigate to congratulations page
    router.push('/congradulation')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-green-900 mb-4 tracking-tight">
            {settings.title}
          </h1>
          <p className="text-lg md:text-xl text-green-800 max-w-2xl mx-auto leading-relaxed">
            {settings.description}
          </p>
        </div>

        {loading ? (
          <Card className="p-12 text-center shadow-md border border-green-200 bg-green-50">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-800">Загрузка вопросов...</p>
            </div>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center shadow-md border border-green-200 bg-green-50">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-green-900 mb-2 text-lg">Вопросов еще не добавлено</p>
            <p className="text-sm text-green-700">
              Перейдите в{' '}
              <a href="/new-admin" className="text-green-600 hover:text-green-700 underline underline-offset-2 font-medium">
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
              errorQuestionIds={errorQuestionIds}
            />

            {/* Submit Button */}
            <div className="mt-10 flex justify-center">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-green-700 hover:bg-green-800 text-white px-10 py-3 text-lg shadow-lg shadow-green-700/25 transition-all hover:shadow-xl hover:shadow-green-700/30"
              >
                Отправить ответы
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md bg-white border border-green-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-green-900">
                Не все вопросы заполнены
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="text-green-800">
              <p className="mb-3">Пожалуйста, ответьте на следующие обязательные вопросы:</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {missingQuestions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="text-green-800">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
