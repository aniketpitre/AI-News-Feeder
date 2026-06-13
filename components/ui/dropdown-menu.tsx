"use client"

import * as React from "react"

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="absolute z-50 bg-white border rounded">{children}</div>
}

export default DropdownMenu
