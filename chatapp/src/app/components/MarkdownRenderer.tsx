'use client'

import React from 'react'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Function to apply syntax highlighting to code
  const applySyntaxHighlighting = (code: string, language: string) => {
    if (!code) return ''

    let highlightedCode = code

    // Python syntax highlighting
    if (language === 'python' || language === 'py') {
      // First, protect strings from other replacements
      const strings: string[] = []
      highlightedCode = highlightedCode.replace(
        /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g,
        (match) => {
          const index = strings.length
          strings.push(`<span class="string">${match}</span>`)
          return `__STRING_${index}__`
        }
      )

      // Comments (after strings to avoid conflicts)
      const comments: string[] = []
      highlightedCode = highlightedCode.replace(/(#.*$)/gm, (match) => {
        const index = comments.length
        comments.push(`<span class="comment">${match}</span>`)
        return `__COMMENT_${index}__`
      })

      // Keywords (avoid word boundaries within other words)
      highlightedCode = highlightedCode.replace(
        /\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|lambda|and|or|not|in|is|True|False|None|break|continue|pass|global|nonlocal)\b/g,
        '<span class="keyword">$1</span>'
      )

      // Function definitions (after keywords to get the right coloring)
      highlightedCode = highlightedCode.replace(
        /<span class="keyword">def<\/span>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        '<span class="keyword">def</span> <span class="function">$1</span>'
      )

      // Class definitions
      highlightedCode = highlightedCode.replace(
        /<span class="keyword">class<\/span>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        '<span class="keyword">class</span> <span class="class">$1</span>'
      )

      // Built-in functions (only if not already highlighted)
      highlightedCode = highlightedCode.replace(
        /\b(print|len|str|int|float|list|dict|tuple|set|range|enumerate|zip|map|filter|sorted|max|min|sum|abs|round|type|isinstance|hasattr|getattr|setattr)(?=\s*\()/g,
        '<span class="builtin">$1</span>'
      )

      // Numbers
      highlightedCode = highlightedCode.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="number">$1</span>'
      )

      // Decorators
      highlightedCode = highlightedCode.replace(
        /(@[a-zA-Z_][a-zA-Z0-9_]*)/g,
        '<span class="decorator">$1</span>'
      )

      // Restore strings
      strings.forEach((str, index) => {
        highlightedCode = highlightedCode.replace(`__STRING_${index}__`, str)
      })

      // Restore comments
      comments.forEach((comment, index) => {
        highlightedCode = highlightedCode.replace(
          `__COMMENT_${index}__`,
          comment
        )
      })
    }

    // JavaScript/TypeScript syntax highlighting
    else if (
      language === 'javascript' ||
      language === 'js' ||
      language === 'typescript' ||
      language === 'ts'
    ) {
      // Protect strings first
      const strings: string[] = []
      highlightedCode = highlightedCode.replace(
        /(\/\*[\s\S]*?\*\/|\/\/.*$|`[^`]*`|"[^"]*"|'[^']*')/gm,
        (match) => {
          const index = strings.length
          if (match.startsWith('//') || match.startsWith('/*')) {
            strings.push(`<span class="comment">${match}</span>`)
          } else {
            strings.push(`<span class="string">${match}</span>`)
          }
          return `__STRING_${index}__`
        }
      )

      // Keywords
      highlightedCode = highlightedCode.replace(
        /\b(function|const|let|var|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|class|extends|import|export|from|default|async|await|true|false|null|undefined|typeof|instanceof)\b/g,
        '<span class="keyword">$1</span>'
      )

      // Function definitions
      highlightedCode = highlightedCode.replace(
        /<span class="keyword">function<\/span>\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
        '<span class="keyword">function</span> <span class="function">$1</span>'
      )

      // Numbers
      highlightedCode = highlightedCode.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="number">$1</span>'
      )

      // Restore strings and comments
      strings.forEach((str, index) => {
        highlightedCode = highlightedCode.replace(`__STRING_${index}__`, str)
      })
    }

    return highlightedCode
  }
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    if (!text) return ''

    let html = text

    // Normalize line endings
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Code blocks with language specification (must come first)
    html = html.replace(
      /```(\w+)?\n?([\s\S]*?)```/g,
      (match, language, code) => {
        const lang = language || ''
        const highlightedCode = applySyntaxHighlighting(code.trim(), lang)
        return `<pre><code class="language-${lang}">${highlightedCode}</code></pre>`
      }
    )

    // Inline code (must come after code blocks)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    // Headers (with proper spacing)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // Bold text - handle both ** and __
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

    // Italic text - only use * for italics to avoid conflicts with snake_case
    html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '<em>$1</em>')

    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')

    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')

    // Process lists with better handling
    const lines = html.split('\n')
    const processedLines = []
    let inOrderedList = false
    let inUnorderedList = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Check for numbered list items
      if (/^\d+\.\s/.test(trimmedLine)) {
        if (!inOrderedList) {
          processedLines.push('<ol>')
          inOrderedList = true
          inUnorderedList = false
        }
        const content = trimmedLine.replace(/^\d+\.\s/, '')
        processedLines.push(`<li>${content}</li>`)
      }
      // Check for bullet list items
      else if (/^[-*]\s/.test(trimmedLine)) {
        if (!inUnorderedList) {
          if (inOrderedList) {
            processedLines.push('</ol>')
            inOrderedList = false
          }
          processedLines.push('<ul>')
          inUnorderedList = true
        }
        const content = trimmedLine.replace(/^[-*]\s/, '')
        processedLines.push(`<li>${content}</li>`)
      }
      // Regular line
      else {
        // Close any open lists
        if (inOrderedList) {
          processedLines.push('</ol>')
          inOrderedList = false
        }
        if (inUnorderedList) {
          processedLines.push('</ul>')
          inUnorderedList = false
        }
        processedLines.push(line)
      }
    }

    // Close any remaining open lists
    if (inOrderedList) {
      processedLines.push('</ol>')
    }
    if (inUnorderedList) {
      processedLines.push('</ul>')
    }

    html = processedLines.join('\n')

    // Handle paragraphs and line breaks with better spacing
    // Split content into blocks separated by double newlines or more
    const blocks = html.split(/\n\s*\n/)
    const processedBlocks = blocks.map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''

      // Don't wrap elements that are already properly formatted
      if (trimmed.match(/^<(ol|ul|h[1-6]|pre|blockquote)/)) {
        return trimmed
      }

      // Handle single lines that should be paragraphs
      const lines = trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line)

      if (lines.length === 1) {
        // Single line - make it a paragraph
        return `<p>${lines[0]}</p>`
      } else {
        // Multiple lines - join with line breaks and wrap in paragraph
        const content = lines.join('<br>')
        return `<p>${content}</p>`
      }
    })

    html = processedBlocks.filter((block) => block).join('\n\n')

    // Clean up any double paragraph wrapping
    html = html.replace(/<p><p>/g, '<p>')
    html = html.replace(/<\/p><\/p>/g, '</p>')

    return html
  }

  return (
    <div
      className='markdown-content'
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
}
