'use client'

import React from 'react'

interface SeparatorProps {
  vertical?: boolean
}

export function Separator({ vertical = false }: SeparatorProps) {
  return (
    <div
      className={vertical
        ? 'border-l mx-2 h-full border-gray-200'
        : 'border-t my-2 w-full border-gray-200'}
    />
  )
}
