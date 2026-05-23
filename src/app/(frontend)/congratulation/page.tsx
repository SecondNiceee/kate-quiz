'use client'

import { Check } from 'lucide-react'

export default function CongradulationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-14 h-14 text-white stroke-[3]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
          Событие зарегистрировано
        </h1>

        {/* Thank you message */}
        <p className="text-2xl md:text-3xl text-emerald-700 font-medium mb-10">
          Спасибо за ваше участие
        </p>
      </div>
    </div>
  )
}
