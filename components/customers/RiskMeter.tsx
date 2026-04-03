'use client'

import React from 'react'

interface RiskMeterProps {
  score: number // 0 to 100
  className?: string
}

export function RiskMeter({ score, className = '' }: RiskMeterProps) {
  // 0 is good (emerald), 100 is bad (rose)
  // We'll normalize colors: 0-25 (safe), 26-60 (warning), 61-100 (danger)
  
  const getPointerPosition = () => {
    const radius = 80
    const angle = (score / 100) * 180 // map 0-100 to 0-180 degrees
    const radian = (angle - 180) * (Math.PI / 180)
    const x = 100 + radius * Math.cos(radian)
    const y = 100 + radius * Math.sin(radian)
    return { x, y }
  }

  const { x, y } = getPointerPosition()

  const getColor = () => {
    if (score <= 25) return '#22c55e' // emerald-500
    if (score <= 60) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  const color = getColor()

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width="200" height="120" viewBox="0 0 200 120" className="drop-shadow-sm">
        {/* Gauge Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#f4f4f5" // zinc-100
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Gauge Progress (Gradient-like discrete segments) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251} 251`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Center Point */}
        <circle cx="100" cy="100" r="4" fill="#000" />
        
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={x}
          y2={y}
          stroke="#000"
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
      
      <div className="mt-[-20px] text-center">
        <span className="text-3xl font-black tracking-tighter" style={{ color }}>{score}</span>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Trust Score</span>
      </div>

      <div className="flex justify-between w-full px-4 mt-4 text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
        <span>Reliable</span>
        <span>Risky</span>
      </div>
    </div>
  )
}
