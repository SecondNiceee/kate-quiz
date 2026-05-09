'use client'

import { useState, useRef, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ChevronDown, Check } from 'lucide-react'
import { TimePicker } from './TimePicker'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type QuestionData = {
  id: number
  question_text: string
  question_type: string
  options: string[]
  units: string[]
  is_required: boolean
}

interface QuestionsProps {
  questions: QuestionData[]
  answers: Record<number, any>
  onAnswerChange: (questionId: number, value: any) => void
  errorQuestionIds?: number[]
}

export function Questions({ questions, answers, onAnswerChange, errorQuestionIds = [] }: QuestionsProps) {
  const [timePickerOpen, setTimePickerOpen] = useState<number | null>(null)
  const [pendingDates, setPendingDates] = useState<Record<number, Date | undefined>>({})
  const [dateDialogOpen, setDateDialogOpen] = useState<number | null>(null)
  const [unitDropdownOpen, setUnitDropdownOpen] = useState<number | null>(null)
  const unitDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) {
        setUnitDropdownOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-emerald-900">Пока нет вопросов. Вернитесь позже.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const hasError = errorQuestionIds.includes(question.id)
        return (
        <div 
          key={question.id} 
          className={`bg-white rounded-lg p-6 border-[1px] shadow-sm transition-colors ${
            hasError 
              ? 'border-red-400 bg-red-50' 
              : 'border-emerald-700'
          }`}
        >
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-4">
            <span className={`text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              hasError ? 'bg-red-600' : 'bg-emerald-800'
            }`}>
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-emerald-950 pt-1">
              {question.question_text}
              {question.is_required && <span className="text-red-500 ml-1">*</span>}
            </h3>
          </div>

          {/* Single Choice */}
          {question.question_type === 'single' && (
            <div className="space-y-2 pl-12">
              {question.options.map((option) => {
                const selected = answers[question.id] === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAnswerChange(question.id, option)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-emerald-700 bg-emerald-50'
                        : 'border-emerald-700 bg-white hover:border-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {/* Custom radio circle */}
                    <span className={`w-5 h-5 rounded-full border-[1px] flex-shrink-0 flex items-center justify-center ${
                      selected ? 'border-emerald-700' : 'border-emerald-700'
                    }`}>
                      {selected && (
                        <span className="w-3 h-3 rounded-full bg-emerald-700" />
                      )}
                    </span>
                    <span className={`text-sm ${selected ? 'text-emerald-950 font-medium' : 'text-emerald-900'}`}>
                      {option}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Multiple Choice */}
          {question.question_type === 'multiple' && (
            <div className="space-y-3 pl-12">
              {question.options.map((option) => (
                <div key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-emerald-50 rounded-md p-2 -ml-2 transition-colors">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    className="cursor-pointer"
                    checked={(answers[question.id] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentAnswers = answers[question.id] || []
                      if (checked) {
                        onAnswerChange(question.id, [...currentAnswers, option])
                      } else {
                        onAnswerChange(
                          question.id,
                          currentAnswers.filter((a: string) => a !== option)
                        )
                      }
                    }}
                  />
                  <label
                    htmlFor={`${question.id}-${option}`}
                    className="text-emerald-900 cursor-pointer flex-1"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Text Input */}
          {question.question_type === 'text' && (
            <div className="pl-12">
              <Input
                type="text"
                placeholder="Введите ваш ответ"
                value={answers[question.id] || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="max-w-md bg-white border-emerald-400 text-emerald-950 placeholder-emerald-600"
              />
            </div>
          )}

          {/* Number Input */}
          {question.question_type === 'number' && (
            <div className="pl-12">
              <div className="flex gap-2 max-w-md">
                <Input
                  type="number"
                  placeholder="Введите число"
                  value={answers[question.id]?.value || ''}
                  onChange={(e) =>
                    onAnswerChange(question.id, {
                      value: e.target.value,
                      unit: answers[question.id]?.unit || ''
                    })
                  }
                  className="flex-1 bg-white border-emerald-400 text-emerald-950 placeholder-emerald-600"
                />
                {question.units && question.units.length > 0 && (
                  <div className="relative" ref={unitDropdownOpen === question.id ? unitDropdownRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setUnitDropdownOpen(unitDropdownOpen === question.id ? null : question.id)}
                      className="flex items-center justify-between gap-3 border border-emerald-400 rounded-md px-3 py-2 text-emerald-900 bg-white hover:border-emerald-600 focus:outline-none focus:border-emerald-600 transition-colors min-w-[120px] cursor-pointer"
                    >
                      <span className="text-sm">
                        {answers[question.id]?.unit || 'Единица'}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-emerald-700 flex-shrink-0 transition-transform ${unitDropdownOpen === question.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {unitDropdownOpen === question.id && (
                      <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-emerald-300 rounded-lg shadow-lg min-w-full overflow-hidden">
                        {question.units.map((unit) => {
                          const isSelected = answers[question.id]?.unit === unit
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => {
                                onAnswerChange(question.id, {
                                  value: answers[question.id]?.value || '',
                                  unit
                                })
                                setUnitDropdownOpen(null)
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-emerald-50 transition-colors cursor-pointer ${
                                isSelected ? 'text-emerald-950 font-medium bg-emerald-50' : 'text-emerald-900'
                              }`}
                            >
                              <span>{unit}</span>
                              {isSelected && <Check size={14} className="text-emerald-700 flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date Picker */}
          {question.question_type === 'date' && (
            <div className="pl-12">
              <Dialog
                open={dateDialogOpen === question.id}
                onOpenChange={(open) => {
                  if (open) {
                    setPendingDates(prev => ({ ...prev, [question.id]: answers[question.id] ? new Date(answers[question.id]) : undefined }))
                    setDateDialogOpen(question.id)
                  } else {
                    setDateDialogOpen(null)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-md justify-start text-left cursor-pointer bg-white border-emerald-400 text-emerald-900 hover:border-emerald-600"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {answers[question.id]
                      ? format(new Date(answers[question.id]), 'd MMMM yyyy', { locale: ru })
                      : 'Выберите дату'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm bg-white border border-emerald-300">
                  <DialogHeader>
                    <DialogTitle className="text-emerald-950">Выберите дату</DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    <CalendarComponent
                      mode="single"
                      locale={ru}
                      selected={pendingDates[question.id]}
                      onSelect={(date) => {
                        setPendingDates(prev => ({ ...prev, [question.id]: date }))
                      }}
                      className="rounded-md border border-emerald-300 w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="cursor-pointer bg-white border-emerald-400 text-emerald-900 hover:bg-emerald-50">Отмена</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        className="cursor-pointer bg-emerald-950 hover:bg-black"
                        onClick={() => {
                          onAnswerChange(question.id, pendingDates[question.id]?.toISOString())
                        }}
                      >
                        Принять
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Time Picker */}
          {question.question_type === 'time' && (
            <div className="pl-12">
              <Button
                variant="outline"
                onClick={() => setTimePickerOpen(question.id)}
                className="w-full max-w-md justify-start bg-white border-emerald-400 text-emerald-900 hover:border-emerald-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                {answers[question.id] || 'Выберите время'}
              </Button>
              {timePickerOpen === question.id && (
                <TimePicker
                  value={answers[question.id] || '12:00'}
                  onChange={(time) => onAnswerChange(question.id, time)}
                  onClose={() => setTimePickerOpen(null)}
                />
              )}
            </div>
          )}
        </div>
      )})}
    </div>
  )
}
