"use client"

import * as React from "react"

export function Dialog({ children, open }: { children: React.ReactNode; open?: boolean }) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  )
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default Dialog
