'use client'

import { useState, useRef, useEffect } from 'react'
import {
  SendIcon,
  RotateCcwIcon,
  BotIcon,
  UserIcon,
  SparklesIcon,
} from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Force dark mode on component mount
    document.documentElement.classList.add('dark')
  }, [])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      role: 'user',
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch(
        'https://chat-app-5x03.onrender.com/api/chat/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputText,
            model_name: 'gemini-2.0-flash',
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Split by double newline to separate SSE messages
          const messages = buffer.split('\n\n')
          // Keep the last incomplete message in buffer
          buffer = messages.pop() || ''

          for (const message of messages) {
            const lines = message.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim()
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr)
                    if (data.content) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: data.content }
                            : msg
                        )
                      )
                    }
                    // Handle error responses
                    if (data.error) {
                      console.error('Server error:', data.content)
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Line:', line)
                  // Log the problematic line for debugging
                  console.error('Problematic line:', JSON.stringify(line))
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your message.',
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      await fetch('https://chat-app-5x03.onrender.com/api/chat/reset', {
        method: 'POST',
      })
      setMessages([])
    } catch (error) {
      console.error('Error resetting conversation:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className='flex flex-col h-screen transition-colors duration-300'>
      {/* Header */}
      <header className='glass backdrop-blur-md border-b px-4 py-3 shadow-sm'>
        <div className='flex items-center justify-between max-w-4xl mx-auto'>
          <div
            onClick={handleReset}
            className='cursor-pointer flex items-center space-x-3'
          >
            <div className='relative'>
              <div className='w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md'>
                <SparklesIcon className='w-4 h-4 text-white' />
              </div>
              <div className='absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
            </div>
            <div className='hidden sm:block'>
              <h1 className='text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent'>
                AI Chat Assistant
              </h1>
            </div>
            <div className='sm:hidden'>
              <h1 className='text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent'>
                AI Chat
              </h1>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={handleReset}
              className='cursor-pointer flex items-center space-x-2 px-4 py-2 text-sm font-medium
             bg-gradient-to-r from-purple-500 to-purple-600 text-white
             rounded-lg shadow-md hover:scale-105 hover:from-purple-600 hover:to-purple-700
             transition-all duration-200 border border-transparent
             focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
              title='Reset conversation'
            >
              <RotateCcwIcon className='w-4 h-4' />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container with ChatGPT-like layout */}
      <div className='flex-1 flex justify-center gradient-bg overflow-hidden'>
        <div className='w-full max-w-4xl flex flex-col h-full'>
          {/* Messages Area */}
          <div className='flex-1 overflow-y-auto custom-scrollbar px-4'>
            <div className='py-4'>
              {messages.length === 0 ? (
                <div className='text-center py-12 fade-in'>
                  <div className='relative inline-block mb-6'>
                    <div className='w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg'>
                      <SparklesIcon className='w-6 h-6 text-white' />
                    </div>
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-bounce'></div>
                  </div>
                  <h2
                    className='text-xl font-bold mb-3'
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Welcome to AI Chat
                  </h2>
                  <p
                    className='max-w-md mx-auto text-sm leading-relaxed'
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Start a conversation with your AI assistant. Ask questions,
                    get help, or explore ideas together!
                  </p>
                  <div className='mt-6 flex flex-wrap justify-center gap-2'>
                    {[
                      'How can you help me?',
                      'Explain quantum computing',
                      'Write a poem',
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputText(suggestion)}
                        className='px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600'
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 message-animate ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <UserIcon className='w-4 h-4 text-white' />
                        ) : (
                          <BotIcon className='w-4 h-4 text-white' />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${
                          message.role === 'user'
                            ? 'flex justify-end'
                            : 'w-full'
                        }`}
                      >
                        <div
                          className={`message-bubble ${
                            message.role === 'user'
                              ? 'message-bubble-user'
                              : 'message-bubble-assistant'
                          } ${message.role === 'assistant' ? 'relative' : ''}`}
                        >
                          {message.content ? (
                            message.role === 'assistant' ? (
                              <MarkdownRenderer content={message.content} />
                            ) : (
                              <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                                {message.content}
                              </p>
                            )
                          ) : (
                            <div className='flex items-center space-x-2'>
                              <span
                                className='text-sm'
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                Thinking
                              </span>
                              <div className='typing-dots'>
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-right' : ''
                          }`}
                          style={{ color: 'var(--text-tertiary)' }}
                        ></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className='input-area backdrop-blur-md px-4 py-3'>
            <div className='flex items-end space-x-3'>
              <div className='flex-1 relative'>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder='Type your message here...'
                  rows={1}
                  className='input-glass w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-sm transition-all duration-200 text-sm'
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px',
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className='p-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group'
                title='Send message'
              >
                <SendIcon className='w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200' />
              </button>
            </div>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
