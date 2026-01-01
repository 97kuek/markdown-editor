import { EditorView } from "codemirror"

export function setupFileSystem(editorView: EditorView, onFileLoad: (content: string) => void) {
    let fileHandle: FileSystemFileHandle | null = null

    const btnOpen = document.getElementById('btn-open')
    const btnSave = document.getElementById('btn-save')

    // --- Open File Logic ---
    btnOpen?.addEventListener('click', async () => {
        // Check if FS Access API is supported
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: { 'text/markdown': ['.md', '.markdown'] }
                    }]
                })
                fileHandle = handle
                const file = await fileHandle.getFile()
                const content = await file.text()
                replaceEditorContent(editorView, content)
                onFileLoad(content)
            } catch (err) { console.log(err) }
        } else {
            // Fallback: <input type="file">
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.md,.markdown'
            input.style.display = 'none'
            document.body.appendChild(input)

            input.onchange = (e: any) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (re) => {
                    const content = re.target?.result as string
                    replaceEditorContent(editorView, content)
                    onFileLoad(content)
                    document.body.removeChild(input)
                }
                reader.readAsText(file)
            }
            input.click()
        }
    })

    // --- Save File Logic ---
    btnSave?.addEventListener('click', async () => {
        // Check if FS Access API is supported
        if ('showSaveFilePicker' in window && fileHandle) {
            // If we have a handle and API support, save to handle
            await saveToHandle(fileHandle, editorView.state.doc.toString())
        } else if ('showSaveFilePicker' in window) {
            // If support but no handle, show "Save As"
            try {
                fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: { 'text/markdown': ['.md', '.markdown'] }
                    }]
                })
                await saveToHandle(fileHandle, editorView.state.doc.toString())
            } catch (err) { console.log(err) }
        } else {
            // Fallback: Blob Download
            const blob = new Blob([editorView.state.doc.toString()], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'document.md'
            a.click()
            URL.revokeObjectURL(url)
        }
    })
}

function replaceEditorContent(view: EditorView, text: string) {
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
    })
}

async function saveToHandle(handle: FileSystemFileHandle, content: string) {
    try {
        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
        alert('Saved!')
    } catch (err) {
        console.log(err)
        alert('Failed to save.')
    }
}
