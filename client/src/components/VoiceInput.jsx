import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

/**
 * VoiceInput - Voice-to-text component using Web Speech API
 * 
 * @param {string} value - Current text value
 * @param {function} onChange - Callback when text changes
 * @param {string} placeholder - Placeholder text
 * @param {number} rows - Number of textarea rows
 * @param {string} className - Additional CSS classes
 */
export function VoiceInput({ value, onChange, placeholder, rows = 2, className = '' }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-AU' // Australian English

      recognitionRef.current.onresult = (event) => {
        // Clear silence timer on new speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }

        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Update text field with transcribed speech
        if (finalTranscript) {
          const newValue = value ? value + ' ' + finalTranscript.trim() : finalTranscript.trim()
          onChange(newValue)
        }

        // Auto-stop after 2 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          stopListening()
        }, 2000)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable in browser settings.')
        } else if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.')
        } else if (event.error !== 'aborted') {
          toast.error('Voice recognition failed. Please try typing instead.')
        }
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
      }
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      toast.success('🎤 Listening... Speak now', { duration: 2000 })
    } catch (error) {
      console.error('Failed to start recognition:', error)
      toast.error('Failed to start voice input')
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsListening(false)
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    } catch (error) {
      console.error('Failed to stop recognition:', error)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border ${isListening ? 'border-gf-teal ring-2 ring-gf-teal' : 'border-gray-300'} rounded-lg px-4 py-3 pr-12 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gf-teal resize-none ${className}`}
      />
      
      {/* Mic button */}
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-3 top-3 p-2 rounded-full transition-all ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gf-teal hover:text-white'
          }`}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {/* Stop icon */}
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {/* Microphone icon */}
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M5.5 9.643a.75.75 0 011.06 0A5.001 5.001 0 0015 10a.75.75 0 00-1.5 0 3.5 3.5 0 11-7 0 .75.75 0 00-1.06.643v.607zM10 14a.75.75 0 00-.75.75V16a.75.75 0 001.5 0v-1.25A.75.75 0 0010 14zM7 16.75a.75.75 0 001.5 0v-.5a.75.75 0 00-1.5 0v.5zM13 16.75a.75.75 0 01-1.5 0v-.5a.75.75 0 011.5 0v.5z" />
            </svg>
          )}
        </button>
      )}

      {/* Recording indicator */}
      {isListening && (
        <div className="absolute left-3 bottom-3 flex items-center gap-2 text-xs text-red-600 font-medium">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Recording...
        </div>
      )}
    </div>
  )
}
