import React from 'react'

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className ?? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-200'}>{children}</span>
}

export default Badge
