
import MarkdownIt from "markdown-it"
import hljs from "highlight.js"

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
})

// Simulate the logic in preview.ts
const injectLineNumber = (tokens: any, idx: number) => {
    const token = tokens[idx]
    if (token.map && token.map.length) {
        token.attrSet('data-source-line', String(token.map[0] + 1))
    }
}

// Check if fence rule exists
console.log('Original fence rule:', !!md.renderer.rules.fence);

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

const complexRules = ['fence', 'code_block', 'image']
complexRules.forEach(rule => {
    const original = md.renderer.rules[rule]
    if (original) {
        md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
            injectLineNumber(tokens, idx)
            return original(tokens, idx, options, env, self)
        }
    } else {
        console.log(`Warning: No original rule for ${rule}`);
    }
})

const input = '```typescript\nconsole.log("test")\n```';
const output = md.render(input);

console.log('Output lines:');
console.log(output);
