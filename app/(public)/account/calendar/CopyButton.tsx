'use client'

import { useState } from 'react'

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-ghost"
      style={{ fontSize: '0.7rem' }}
    >
      <span>{copied ? 'Copied!' : 'Copy Feed URL'}</span>
    </button>
  )
}
