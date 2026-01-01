import MarkdownIt from "markdown-it"
import texmath from "markdown-it-texmath"
import katex from "katex"

// Setup parser
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})

// Use texmath plugin
md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { macros: { "\\RR": "\\mathbb{R}" } } // example options
})

export function renderMarkdown(content: string, element: HTMLElement) {
    const html = md.render(content)
    element.innerHTML = html
}
