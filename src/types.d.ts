declare module 'markdown-it-katex' {
    import MarkdownIt = require('markdown-it');
    const markdownItKatex: (md: MarkdownIt, options?: any) => void;
    export = markdownItKatex;
}

declare module 'markdown-it-texmath' {
    import MarkdownIt = require('markdown-it');
    const texmath: (md: MarkdownIt, options?: any) => void;
    export default texmath;
}
