const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

export async function chatWithOllama(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const prompt = [
    `System: ${systemPrompt}`,
    ...messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
    'Assistant:',
  ].join('\n\n')

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.1:8b', prompt, stream: false }),
  })

  if (!res.ok) throw new Error('Ollama unavailable')
  const data = await res.json()
  return data.response ?? ''
}
