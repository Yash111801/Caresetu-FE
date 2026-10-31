import { useEffect, useRef, useState } from 'react'

type Props = {
  onText: (text: string) => void
  lang?: string
}

type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

export function VoiceCapture({ onText, lang = 'en-IN' }: Props) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const recRef = useRef<SpeechRec | null>(null)

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec
      webkitSpeechRecognition?: new () => SpeechRec
    }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript || ''
      if (text) onText(text)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec
  }, [lang, onText])

  if (!supported) {
    return (
      <button type="button" className="btn ghost sm" disabled title="Speech recognition not available">
        Voice unavailable
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`btn ghost sm ${listening ? 'listening' : ''}`}
      onClick={() => {
        const rec = recRef.current
        if (!rec) return
        if (listening) {
          rec.stop()
          setListening(false)
          return
        }
        setListening(true)
        rec.start()
      }}
    >
      {listening ? 'Listening…' : '🎙 Voice note'}
    </button>
  )
}
