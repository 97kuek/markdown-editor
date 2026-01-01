import './style.css'
import 'github-markdown-css/github-markdown-dark.css'
import 'katex/dist/katex.min.css'
import 'markdown-it-texmath/css/texmath.css'
import './katex-fix.css' // Keep for now, might check if needed
import './resizer.css'


import { createEditor } from './editor'
import { renderMarkdown } from './preview'
import { ScrollSync } from './scroll-sync'
import { enableResizer } from './resizer'
import { setupFileSystem } from './fs-access'

const STORAGE_KEY = 'mde-content'
const initialContent = localStorage.getItem(STORAGE_KEY) || `# Welcome to Markdown Editor

This is a lightweight, real-time preview editor.

## Features
- **Real-time Preview**
- **Math Support**: $E = mc^2$
- **Scroll Sync**
- **Export to PDF/MD**

## Try Math

$$
\\frac{1}{\\Bigl(\\sqrt{\\phi \\sqrt{5}}-\\phi\\Bigr) e^{\\frac25 \\pi}} = 1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}} {1+\\frac{e^{-8\\pi}} {1+\\dots} } } }
$$

## Code

\`\`\`typescript
console.log("Hello World");
\`\`\`
`

const editorPane = document.getElementById('editor-pane') as HTMLElement
const previewPane = document.getElementById('preview-pane') as HTMLElement
const resizerElement = document.getElementById('resizer') as HTMLElement
const container = document.getElementById('workspace') as HTMLElement

enableResizer(resizerElement, editorPane, container)

// Initialize Editor
const editorView = createEditor(editorPane, initialContent, (doc) => {
  renderMarkdown(doc, previewPane)
  localStorage.setItem(STORAGE_KEY, doc)
}, () => {
  // logic handled in scrollSync, this callback might be redundant if we bind directly in ScrollSync
  // but keeping it for potential extensions
})

// Initialize Preview
renderMarkdown(initialContent, previewPane)

// Initialize Scroll Sync
new ScrollSync(editorView, previewPane)

// Initialize File System Access
setupFileSystem(editorView, (content) => {
  renderMarkdown(content, previewPane)
  localStorage.setItem(STORAGE_KEY, content)
})

// Export Buttons
document.getElementById('btn-export-md')?.addEventListener('click', () => {
  const content = editorView.state.doc.toString()
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
})

document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
  window.print()
})
