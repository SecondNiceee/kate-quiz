'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  onClose?: () => void
}

export function TimePicker({ value = '12:00', onChange, onClose }: TimePickerProps) {
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 12)
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0)

  const incrementHours = () => setHours((h) => (h + 1) % 24)
  const decrementHours = () => setHours((h) => (h - 1 + 24) % 24)
  const incrementMinutes = () => setMinutes((m) => (m + 1) % 60)
  const decrementMinutes = () => setMinutes((m) => (m - 1 + 60) % 60)

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0
    if (val >= 0 && val <= 23) {
      setHours(val)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0
    if (val >= 0 && val <= 59) {
      setMinutes(val)
    }
  }

  const handleConfirm = () => {
    const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    onChange?.(newTime)
    onClose?.()
  }

  const quickMinutes = [0, 15, 30, 45]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Выберите время</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <button
              onClick={incrementHours}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronUp size={28} className="text-purple-600" />
            </button>
            <div className="w-20 h-20 flex items-center justify-center bg-purple-50 rounded-xl border-2 border-purple-200">
              <span className="text-4xl font-bold text-purple-600">
                {hours.toString().padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={decrementHours}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronDown size={28} className="text-purple-600" />
            </button>
            <span className="text-xs text-gray-500 mt-1">часы</span>
          </div>

          {/* Separator */}
          <span className="text-4xl font-bold text-gray-400 mb-6">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              onClick={incrementMinutes}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronUp size={28} className="text-purple-600" />
            </button>
            <div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-gray-200">
              <span className="text-4xl font-bold text-gray-700">
                {minutes.toString().padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={decrementMinutes}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronDown size={28} className="text-purple-600" />
            </button>
            <span className="text-xs text-gray-500 mt-1">минуты</span>
          </div>
        </div>

        {/* Quick Minutes Selection */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2 text-center">Быстрый выбор минут</p>
          <div className="flex justify-center gap-2">
            {quickMinutes.map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`w-12 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  minutes === m
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                :{m.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 cursor-pointer"
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  )
}
