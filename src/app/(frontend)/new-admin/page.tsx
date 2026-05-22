'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { QuestionForm } from '@/components/quiz/QuestionForm'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, Settings, Check, X } from 'lucide-react'

type QuizSettings = {
  title: string
  description: string
}

type Question = {
  id: number
  question_text: string
  question_type: string
  options: string[]
  units: string[]
  is_required: boolean
  order_index: number
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const originalOrderRef = useRef<number[]>([])

  const [settings, setSettings] = useState<QuizSettings>({ title: '', description: '' })
  const [editingSettings, setEditingSettings] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<QuizSettings>({ title: '', description: '' })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/quiz-settings')
      const data = await res.json()
      if (data && data.title) {
        setSettings(data)
        setSettingsDraft(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSettingsEdit = () => {
    setSettingsDraft({ ...settings })
    setEditingSettings(true)
  }

  const handleSettingsCancel = () => {
    setSettingsDraft({ ...settings })
    setEditingSettings(false)
  }

  const handleSettingsSave = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/quiz-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft),
      })
      const data = await res.json()
      setSettings(data)
      setEditingSettings(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      const data = await response.json()
      console.log('[v0] Admin Questions API response:', data)
      if (Array.isArray(data)) {
        setQuestions(data)
        originalOrderRef.current = data.map((q: Question) => q.id)
      } else {
        console.error('[v0] Admin Questions API returned non-array:', data)
        setQuestions([])
        originalOrderRef.current = []
      }
      setHasOrderChanges(false)
    } catch (error) {
      console.error('[v0] Error fetching questions:', error)
      setQuestions([])
      originalOrderRef.current = []
    } finally {
      setLoading(false)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingQuestion(null)
    }
  }

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Вы уверены?')) return

    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      setQuestions(questions.filter(q => q.id !== id))
      originalOrderRef.current = originalOrderRef.current.filter(qId => qId !== id)
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  const handleMoveQuestion = (id: number, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const newQuestions = [...questions]
    const [movedQuestion] = newQuestions.splice(currentIndex, 1)
    newQuestions.splice(newIndex, 0, movedQuestion)
    
    setQuestions(newQuestions)
    
    // Check if order changed from original
    const currentOrder = newQuestions.map(q => q.id)
    const hasChanges = !currentOrder.every((id, idx) => id === originalOrderRef.current[idx])
    setHasOrderChanges(hasChanges)
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const orderData = questions.map((q, index) => ({
        id: q.id,
        order_index: index
      }))
      
      const response = await fetch('/api/questions/reorder-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: orderData })
      })
      
      if (response.ok) {
        originalOrderRef.current = questions.map(q => q.id)
        setHasOrderChanges(false)
      }
    } catch (error) {
      console.error('Error saving order:', error)
    } finally {
      setSavingOrder(false)
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'single': 'Одиночный выбор',
      'multiple': 'Множественный выбор',
      'text': 'Текстовый ответ',
      'number': 'Числовой ответ',
      'date': 'Дата',
      'time': 'Время'
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Админ-панель опросника</h1>
          <p className="text-gray-600">Управление вопросами и ответами</p>
        </div>

        {/* Quiz Settings */}
        <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Настройки опросника</h2>
            </div>
            {!editingSettings && (
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                onClick={handleSettingsEdit}
              >
                <Edit2 size={16} className="mr-1" />
                Изменить
              </Button>
            )}
          </div>

          {editingSettings ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <Input
                  value={settingsDraft.title}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, title: e.target.value })}
                  placeholder="Название опросника"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={settingsDraft.description}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, description: e.target.value })}
                  placeholder="Описание опросника"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  onClick={handleSettingsSave}
                  disabled={savingSettings}
                >
                  <Check size={15} className="mr-1" />
                  {savingSettings ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:bg-gray-100 cursor-pointer"
                  onClick={handleSettingsCancel}
                >
                  <X size={15} className="mr-1" />
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Название</span>
                <p className="text-gray-900 font-medium mt-0.5">{settings.title || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Описание</span>
                <p className="text-gray-700 text-sm mt-0.5">{settings.description || '—'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Question Button */}
        <div className="mb-6">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            Добавить новый вопрос
          </Button>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">Вопросов еще не добавлено</p>
            <p className="text-sm text-gray-500">Нажмите кнопку выше, чтобы создать первый вопрос</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {question.question_text}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                      {question.is_required && (
                        <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                          Обязательный
                        </span>
                      )}
                    </div>

                    {/* Options */}
                    {question.options && question.options.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Варианты ответов:</p>
                        <ul className="space-y-1">
                          {question.options.map((option, idx) => (
                            <li key={idx} className="text-sm text-gray-600">
                              • {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Units */}
                    {question.units && question.units.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Единицы измерения:</p>
                        <div className="flex flex-wrap gap-2">
                          {question.units.map((unit, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                              {unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleMoveQuestion(question.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleMoveQuestion(question.id, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit2 size={18} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Question Form Dialog */}
      <QuestionForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={() => fetchQuestions()}
        editingQuestion={editingQuestion}
      />

      {/* Save Order Button - Fixed Position */}
      {hasOrderChanges && (
        <div className="fixed top-6 right-6 z-50">
          <Button
            onClick={handleSaveOrder}
            disabled={savingOrder}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg cursor-pointer"
            size="lg"
          >
            <Save size={20} className="mr-2" />
            {savingOrder ? 'Сохранение...' : 'Сохранить порядок'}
          </Button>
        </div>
      )}
    </div>
  )
}
