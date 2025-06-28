
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  backUrl?: string
}

export default function Layout({ children, title, showBackButton = false, backUrl = '/' }: LayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
        <nav className="relative z-10 container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <button 
                  onClick={() => router.push(backUrl)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-all"
                >
                  <span className="text-lg">←</span>
                </button>
              )}
              <Link href="/" className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">⚽</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Bolão TV Loteca</h1>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-white/90 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/ranking/geral" className="text-white/90 hover:text-white transition-colors">
                Ranking
              </Link>
              <Link href="/admin" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                Admin
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Page Title */}
      {title && (
        <div className="py-8 px-6">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white text-center">{title}</h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 mt-20">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚽</span>
            </div>
            <span className="text-white font-semibold">Bolão TV Loteca</span>
          </div>
          <p className="text-white/60">© 2025 Bolão TV Loteca. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
