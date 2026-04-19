const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-US',
  am: 'am-ET',
  fr: 'fr-FR',
  ht: 'fr-HT',
  vi: 'vi-VN',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-SA',
  pt: 'pt-BR',
}

export function speak(text: string, detectedLang = 'en'): void {
  if (typeof window === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG_MAP[detectedLang] ?? detectedLang
  utterance.rate = 0.9
  utterance.pitch = 1.0
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
}
