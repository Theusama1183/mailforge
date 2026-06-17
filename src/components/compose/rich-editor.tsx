"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, List, Heading } from "lucide-react"

export function RichEditor({
  value,
  onChange,
  placeholder = "Write your message...",
}: {
  value: string
  onChange: (html: string, text: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[180px] px-0 py-2 text-sm text-gray-700 dark:text-gray-300",
      },
    },
  })

  if (!editor) return null

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleHeading = () => editor.chain().focus().toggleHeading({ level: 2 }).run()

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <button
          type="button"
          onClick={toggleBold}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          <Bold className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          <Italic className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={toggleHeading}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive("heading") ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          <Heading className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={toggleBulletList}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive("bulletList") ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          <List className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
      <EditorContent editor={editor} className="px-3" />
    </div>
  )
}
