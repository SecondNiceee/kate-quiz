'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  onClose?: () => void
}

export function TimePicker({ value = '12:00', onChange, onClose }: TimePickerProps) {
  const [time, setTime] = useState(value)
  const [hours, setHours] = useState(parseInt(value.split(':')[0]))
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw clock
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw clock circle
    ctx.fillStyle = '#f3f4f6'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw border
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw hour numbers
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < 24; i++) {
      const angle = (i - 3) * (Math.PI * 2 / 24)
      const x = centerX + Math.cos(angle) * (radius - 30)
      const y = centerY + Math.sin(angle) * (radius - 30)
      const num = i === 0 ? '24' : i.toString().padStart(2, '0')
      ctx.fillText(num, x, y)
    }

    // Draw minutes
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#9ca3af'
    for (let i = 0; i < 60; i += 5) {
      const angle = (i - 15) * (Math.PI * 2 / 60)
      const x = centerX + Math.cos(angle) * (radius - 50)
      const y = centerY + Math.sin(angle) * (radius - 50)
      ctx.fillText(i.toString().padStart(2, '0'), x, y)
    }

    // Draw hour hand (purple)
    const hourAngle = ((hours % 24) - 3) * (Math.PI * 2 / 24) + ((minutes) * (Math.PI * 2 / (24 * 60)))
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(
      centerX + Math.cos(hourAngle) * (radius - 60),
      centerY + Math.sin(hourAngle) * (radius - 60)
    )
    ctx.stroke()

    // Draw minute hand (purple, longer)
    const minuteAngle = ((minutes - 15) * (Math.PI * 2 / 60))
    ctx.strokeStyle = '#9333ea'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(
      centerX + Math.cos(minuteAngle) * (radius - 30),
      centerY + Math.sin(minuteAngle) * (radius - 30)
    )
    ctx.stroke()

    // Draw center dot
    ctx.fillStyle = '#a855f7'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
    ctx.fill()
  }, [hours, minutes])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.width / 2
    const y = e.clientY - rect.top - canvas.height / 2

    const angle = Math.atan2(y, x) + Math.PI / 2
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle

    // Determine if clicking on hour or minute
    const distance = Math.sqrt(x * x + y * y)
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20

    if (distance < radius - 40) {
      // Hour selection
      const h = Math.round((normalizedAngle / (Math.PI * 2)) * 24)
      setHours(h === 24 ? 0 : h)
    } else {
      // Minute selection
      const m = Math.round((normalizedAngle / (Math.PI * 2)) * 60) % 60
      setMinutes(m)
    }
  }

  const handleConfirm = () => {
    const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    setTime(newTime)
    onChange?.(newTime)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Выбор времени</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Digital Display */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4 text-center">
          <div className="text-5xl font-bold text-purple-600">
            {hours.toString().padStart(2, '0')}
          </div>
          <div className="text-3xl text-gray-400 mb-2">:</div>
          <div className="text-5xl font-bold text-gray-400">
            {minutes.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Clock */}
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          onClick={handleCanvasClick}
          className="w-full border border-gray-200 rounded-lg mb-4 cursor-pointer"
        />

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Часы</label>
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              className="w-full border rounded px-2 py-1 text-center"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Минуты</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-full border rounded px-2 py-1 text-center"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            + Добавить {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
          </Button>
        </div>
      </div>
    </div>
  )
}
