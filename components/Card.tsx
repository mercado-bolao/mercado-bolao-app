
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
}

export default function Card({ children, className = '', hover = false, glass = false }: CardProps) {
  const baseClasses = glass 
    ? "bg-white/10 backdrop-blur-sm border border-white/20" 
    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
  
  const hoverClasses = hover 
    ? "hover:shadow-lg hover:scale-105 transition-all duration-300" 
    : ""

  return (
    <div className={`rounded-2xl p-6 ${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}
