import * as React from "react"

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={props.className ?? 'border rounded p-2'} />
}

export default Textarea
