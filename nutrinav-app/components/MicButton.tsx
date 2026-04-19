'use client'

import { useRef, useState } from 'react'

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function mimeToExtension(mime: string): string {
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4')) return 'mp4'
  return 'webm'
}

export function MicButton({ onTranscript }: { onTranscript: (text: string, lang: string) => void }) {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)
      mediaRecorder.current = recorder
      audioChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        setLoading(true)

        const actualMime = recorder.mimeType || mimeType || 'audio/webm'
        const ext = mimeToExtension(actualMime)
        const audioBlob = new Blob(audioChunks.current, { type: actualMime })

        if (audioBlob.size < 1000) {
          setError('Recording too short — try again')
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('audio', audioBlob, `voice.${ext}`)

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.error) {
            setError(data.error)
          } else if (data.text?.trim()) {
            onTranscript(data.text.trim(), data.language ?? 'en')
            setError('')
          } else {
            setError('No speech detected — try again')
          }
        } catch {
          // Fallback: browser Web Speech API
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          if (Ctor) {
            const recognition = new Ctor()
            recognition.onresult = (e: /* eslint-disable @typescript-eslint/no-explicit-any */ any) =>
              onTranscript(e.results[0][0].transcript, 'en')
            recognition.onerror = () => setError('Voice failed — please type')
            recognition.start()
          } else {
            setError('Voice unavailable — please type')
          }
        } finally {
          setLoading(false)
        }
      }

      recorder.start(250)
      setRecording(true)
    } catch {
      setError('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
    setRecording(false)
  }

  const handleClick = () => {
    if (loading) return
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl transition-all select-none ${
          recording
            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200'
            : loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#1A7A6E] hover:bg-[#156358] active:scale-95'
        }`}
        title={recording ? 'Click to stop' : 'Click to speak'}
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : recording ? '⏹' : '🎤'}
      </button>
      <p className="text-xs text-center text-gray-400 leading-tight">
        {recording ? 'Tap to stop' : loading ? 'Transcribing…' : 'Tap to speak'}
      </p>
      {error && (
        <p className="text-xs text-red-500 text-center max-w-32 leading-tight">{error}</p>
      )}
    </div>
  )
}
