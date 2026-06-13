"use client"

import * as React from "react"

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div className="tabs">{children}</div>
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex">{children}</div>
}

export function TabsTrigger({ children }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button">{children}</button>
}

export function TabsContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export default Tabs
