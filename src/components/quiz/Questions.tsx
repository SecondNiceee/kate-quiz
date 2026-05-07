'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'
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
}

export function Questions({ questions, answers, onAnswerChange }: QuestionsProps) {
  const [timePickerOpen, setTimePickerOpen] = useState<number | null>(null)
  const [pendingDates, setPendingDates] = useState<Record<number, Date | undefined>>({})
  const [dateDialogOpen, setDateDialogOpen] = useState<number | null>(null)

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Пока нет вопросов. Вернитесь позже.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-4">
            <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 pt-1">
              {question.question_text}
              {question.is_required && <span className="text-red-500 ml-1">*</span>}
            </h3>
          </div>

          {/* Single Choice */}
          {question.question_type === 'single' && (
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => onAnswerChange(question.id, value)}
            >
              <div className="space-y-3 pl-12">
                {question.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-md p-2 -ml-2 transition-colors">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} className="cursor-pointer" />
                    <label
                      htmlFor={`${question.id}-${option}`}
                      className="text-gray-700 cursor-pointer flex-1"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Multiple Choice */}
          {question.question_type === 'multiple' && (
            <div className="space-y-3 pl-12">
              {question.options.map((option) => (
                <div key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-md p-2 -ml-2 transition-colors">
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
                    className="text-gray-700 cursor-pointer flex-1"
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
                className="max-w-md"
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
                  className="flex-1"
                />
                {question.units && question.units.length > 0 && (
                  <select
                    value={answers[question.id]?.unit || ''}
                    onChange={(e) =>
                      onAnswerChange(question.id, {
                        value: answers[question.id]?.value || '',
                        unit: e.target.value
                      })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  >
                    <option value="">Выберите единицу</option>
                    {question.units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
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
                    className="w-full max-w-md justify-start text-left cursor-pointer"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {answers[question.id]
                      ? format(new Date(answers[question.id]), 'd MMMM yyyy', { locale: ru })
                      : 'Выберите дату'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Выберите дату</DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    <CalendarComponent
                      mode="single"
                      locale={ru}
                      selected={pendingDates[question.id]}
                      onSelect={(date) => {
                        setPendingDates(prev => ({ ...prev, [question.id]: date }))
                      }}
                      className="rounded-md border w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="cursor-pointer">Отмена</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        className="cursor-pointer"
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
                className="w-full max-w-md justify-start"
              >
                <Clock className="mr-2 h-4 w-4" />
                {answers[question.id] || 'Выберите вре��я'}
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
      ))}
    </div>
  )
}
