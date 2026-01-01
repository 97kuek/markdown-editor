import MarkdownIt from "markdown-it"
import texmath from "markdown-it-texmath"
import katex from "katex"

import hljs from "highlight.js"

// Setup parser
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
})

// Inject line numbers
const injectLineNumber = (tokens: any, idx: number) => {
    const token = tokens[idx]
    if (token.map && token.map.length) {
        token.attrSet('data-source-line', String(token.map[0] + 1)) // 1-based index
    }
}

// Simple rules where we can just inject attribute and render default token
const openerRules = [
    'paragraph_open',
    'heading_open',
    'blockquote_open',
    'list_item_open',
    'bullet_list_open',
    'ordered_list_open',
    'table_open',
    'tr_open'
]

openerRules.forEach(rule => {
    const original = md.renderer.rules[rule] || ((t, i, o, _e, s) => s.renderToken(t, i, o))
    md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
        injectLineNumber(tokens, idx)
        return original(tokens, idx, options, env, self)
    }
})

// Complex rules that usually have their own renderers (fence, code_block, image)
const complexRules = ['fence', 'code_block', 'image']
complexRules.forEach(rule => {
    const original = md.renderer.rules[rule]
    // Only wrap if it exists (it should for these)
    if (original) {
        md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
            injectLineNumber(tokens, idx)
            return original(tokens, idx, options, env, self)
        }
    }
})

md.options.highlight = function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
        try {
            return '<pre class="hljs"><code>' +
                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                '</code></pre>';
        } catch (__) { }
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
}

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
