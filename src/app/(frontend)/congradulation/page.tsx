'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CongradulationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
          Поздравление!
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-600 mb-3">
          Тест закончен
        </p>

        {/* Thank you message */}
        <p className="text-lg text-emerald-700 font-medium mb-10">
          Спасибо за ваше участие
        </p>

        {/* Back button */}
        <Link href="/">
          <Button
            size="lg"
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-8"
          >
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  )
}
