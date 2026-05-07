'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X } from 'lucide-react'

type QuestionType = 'single' | 'multiple' | 'text' | 'number' | 'date' | 'time'

interface QuestionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (question: any) => void
}

export function QuestionForm({ open, onOpenChange, onSubmit }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType>('single')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [units, setUnits] = useState<string[]>([])
  const [isRequired, setIsRequired] = useState(true)

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleAddUnit = () => {
    setUnits([...units, ''])
  }

  const handleRemoveUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index))
  }

  const handleUnitChange = (index: number, value: string) => {
    const newUnits = [...units]
    newUnits[index] = value
    setUnits(newUnits)
  }

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      alert('Введите текст вопроса')
      return
    }

    if ((questionType === 'single' || questionType === 'multiple') && options.some(o => !o.trim())) {
      alert('Заполните все варианты ответов')
      return
    }

    const questionData = {
      question_text: questionText,
      question_type: questionType,
      options: (questionType === 'single' || questionType === 'multiple') ? options.filter(o => o.trim()) : [],
      units: (questionType === 'number') ? units.filter(u => u.trim()) : [],
      is_required: isRequired
    }

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      })

      if (response.ok) {
        // Reset form
        setQuestionText('')
        setQuestionType('single')
        setOptions(['', ''])
        setUnits([])
        setIsRequired(true)
        onOpenChange(false)
        onSubmit(questionData)
      } else {
        alert('Ошибка при создании вопроса')
      }
    } catch (error) {
      console.error('Error creating question:', error)
      alert('Ошибка при создании вопроса')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить новый вопрос</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium mb-2">Текст вопроса</label>
            <Input
              placeholder="Введите вопрос"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Тип вопроса</label>
            <RadioGroup value={questionType} onValueChange={(value) => {
              setQuestionType(value as QuestionType)
              if (value === 'text' || value === 'date' || value === 'time') {
                setOptions([])
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'single', label: 'Одиночный выбор' },
                  { value: 'multiple', label: 'Множественный выбор' },
                  { value: 'text', label: 'Текстовый ответ' },
                  { value: 'number', label: 'Числовой ответ' },
                  { value: 'date', label: 'Дата' },
                  { value: 'time', label: 'Время' }
                ].map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <label htmlFor={type.value} className="text-sm cursor-pointer">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Options for single/multiple choice */}
          {(questionType === 'single' || questionType === 'multiple') && (
            <div>
              <label className="block text-sm font-medium mb-3">Варианты ответов</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Вариант ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    {options.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus size={18} className="mr-1" /> Добавить вариант
              </Button>
            </div>
          )}

          {/* Units for number */}
          {questionType === 'number' && (
            <div>
              <label className="block text-sm font-medium mb-3">Единицы измерения (опционально)</label>
              <div className="space-y-2">
                {units.map((unit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Единица ${index + 1} (например: кг, г, мл)`}
                      value={unit}
                      onChange={(e) => handleUnitChange(index, e.target.value)}
                    />
                    {units.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveUnit(index)}
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddUnit}
                className="mt-2"
              >
                <Plus size={18} className="mr-1" /> Добавить единицу
              </Button>
            </div>
          )}

          {/* Required */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <label htmlFor="required" className="text-sm cursor-pointer">
              Обязательный вопрос
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
              Создать вопрос
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
