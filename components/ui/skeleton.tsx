import React from 'react'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={className ?? 'animate-pulse rounded-md bg-gray-200'} {...props} />
}

export default Skeleton
