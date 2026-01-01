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
md.renderer.rules.paragraph_open = md.renderer.rules.heading_open = md.renderer.rules.image = md.renderer.rules.code_block = md.renderer.rules.fence = md.renderer.rules.blockquote_open = md.renderer.rules.list_item_open = md.renderer.rules.bullet_list_open = md.renderer.rules.ordered_list_open = md.renderer.rules.table_open = md.renderer.rules.tr_open = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    if (token.map && token.map.length) {
        token.attrSet('data-source-line', String(token.map[0] + 1)) // 1-based index
    }
    // Return default render
    return self.renderToken(tokens, idx, options)
}

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
