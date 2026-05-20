'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  background: active ? 'rgba(212,168,83,0.15)' : 'transparent',
  border: `1px solid ${active ? 'rgba(212,168,83,0.4)' : 'transparent'}`,
  borderRadius: '2px',
  color: active ? 'var(--gold)' : 'var(--muted)',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  lineHeight: 1,
  transition: 'all 0.15s',
})

type Props = {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, disabled = false, placeholder }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
  })

  // Sync external value changes (e.g. on first load)
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  const isEmpty = !editor || editor.isEmpty

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '2px',
      background: 'rgba(255,255,255,0.04)',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : undefined,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '2px',
        padding: '6px 8px',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} style={toolbarBtnStyle(!!editor?.isActive('bold'))}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ ...toolbarBtnStyle(!!editor?.isActive('italic')), fontStyle: 'italic' }}>I</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} style={toolbarBtnStyle(!!editor?.isActive('bulletList'))}>• List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={toolbarBtnStyle(!!editor?.isActive('orderedList'))}>1. List</button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '2px 4px' }} />
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} style={toolbarBtnStyle(!!editor?.isActive('heading', { level: 3 }))}>H3</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={toolbarBtnStyle(!!editor?.isActive('blockquote'))}>❝</button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '2px 4px' }} />
        <button type="button" onClick={() => editor?.chain().focus().undo().run()} style={toolbarBtnStyle(false)}>↩</button>
        <button type="button" onClick={() => editor?.chain().focus().redo().run()} style={toolbarBtnStyle(false)}>↪</button>
      </div>

      {/* Editor area */}
      <div style={{ position: 'relative', minHeight: '140px' }}>
        {isEmpty && placeholder && (
          <p style={{
            position: 'absolute', top: '12px', left: '14px',
            color: 'var(--muted)', fontSize: '0.88rem',
            pointerEvents: 'none', userSelect: 'none',
          }}>
            {placeholder}
          </p>
        )}
        <EditorContent
          editor={editor}
          style={{ padding: '12px 14px', minHeight: '140px', outline: 'none' }}
        />
      </div>

      <style>{`
        .tiptap { outline: none; color: var(--warm-white); font-size: 0.88rem; line-height: 1.7; }
        .tiptap p { margin: 0 0 8px; }
        .tiptap p:last-child { margin-bottom: 0; }
        .tiptap strong { color: var(--warm-white); }
        .tiptap em { color: var(--muted); }
        .tiptap h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; margin: 12px 0 6px; color: var(--warm-white); }
        .tiptap ul, .tiptap ol { padding-left: 20px; margin: 0 0 8px; }
        .tiptap li { margin-bottom: 4px; }
        .tiptap blockquote { border-left: 2px solid var(--gold); padding-left: 12px; color: var(--muted); margin: 8px 0; font-style: italic; }
      `}</style>
    </div>
  )
}
