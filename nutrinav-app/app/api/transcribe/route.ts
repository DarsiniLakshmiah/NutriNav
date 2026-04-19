import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile || audioFile.size === 0) {
      return Response.json({ error: 'No audio received' }, { status: 400 })
    }

    // Groq Whisper requires the file name to have a supported extension
    // so the SDK can infer the format — we rely on the filename set by MicButton
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lang = (transcription as any).language ?? 'en'
    const text = transcription.text?.trim() ?? ''

    return Response.json({ text, language: lang })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/transcribe] Groq error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
