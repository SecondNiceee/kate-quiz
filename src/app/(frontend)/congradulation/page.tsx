'use client'

import { CheckCircle } from 'lucide-react'

export default function CongradulationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
          Событие зарегистрировано
        </h1>

        {/* Thank you message */}
        <p className="text-lg text-emerald-700 font-medium mb-10">
          Спасибо за ваше участие
        </p>
      </div>
    </div>
  )
}
