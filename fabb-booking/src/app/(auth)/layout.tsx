import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 ${inter.className}`}>
      <div className="mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <span className="text-xl font-semibold text-slate-900">Fabb.booking</span>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-sm text-slate-400">
        © 2026 Fabb.booking. All rights reserved.
      </p>
    </div>
  )
}
