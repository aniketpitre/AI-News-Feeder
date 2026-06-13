"use client"

import * as React from "react"

export function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? 'overflow-auto'}>{children}</div>
}

export function ScrollBar() {
  return null
}

export default ScrollArea
