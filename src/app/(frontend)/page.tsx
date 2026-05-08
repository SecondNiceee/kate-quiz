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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-4">
            {settings.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            {settings.description}
          </p>
        </div>

        {loading ? (
          <Card className="p-12 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Загрузка вопросов...</p>
            </div>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-600 mb-2 text-lg">Вопросов еще не добавлено</p>
            <p className="text-sm text-slate-500">
              Перейдите в{' '}
              <a href="/new-admin" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 text-lg shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
              >
                Отправить ответы
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Не все вопросы заполнены
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="text-slate-600">
              <p className="mb-3">Пожалуйста, ответьте на следующие обязательные вопросы:</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {missingQuestions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="text-slate-700">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
