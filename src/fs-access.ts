import { EditorView } from "codemirror"

export function setupFileSystem(editorView: EditorView, onFileLoad: (content: string) => void) {
    let fileHandle: FileSystemFileHandle | null = null

    const btnOpen = document.getElementById('btn-open')
    const btnSave = document.getElementById('btn-save')

    btnOpen?.addEventListener('click', async () => {
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
            // Update editor
            editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: content }
            })
            onFileLoad(content) // Trigger preview update
        } catch (err) {
            // User cancelled or error
            console.log(err)
        }
    })

    btnSave?.addEventListener('click', async () => {
        try {
            if (!fileHandle) {
                // Save As behavior if no handle
                fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: { 'text/markdown': ['.md', '.markdown'] }
                    }]
                })
            }
            const writable = await fileHandle.createWritable()
            await writable.write(editorView.state.doc.toString())
            await writable.close()
            alert('Saved!')
        } catch (err) {
            console.log(err)
        }
    })
}
