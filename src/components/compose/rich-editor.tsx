"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import LinkExtension from "@tiptap/extension-link"
import ImageExtension from "@tiptap/extension-image"
import UnderlineExtension from "@tiptap/extension-underline"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Bold, Italic, Underline, List, Heading, Link, Image,
  Minus, Code, Undo2, Redo2, Smile, Table as TableIcon,
  Trash2,
} from "lucide-react"

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
  "😋", "😎", "😍", "😘", "🥰", "😗", "😙", "😚", "🙂", "🤗",
  "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥",
  "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝",
  "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁",
  "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩",
  "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "😡",
  "😠", "🤬", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌",
  "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🤟", "🤘", "🤙", "💪",
  "🖕", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💯",
  "⭐", "🌟", "✨", "🔥", "💀", "✅", "❌", "❓", "❗", "🎉",
]

export function RichEditor({
  value,
  onChange,
  placeholder = "Write your message...",
}: {
  value: string
  onChange: (html: string, text: string) => void
  placeholder?: string
}) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Placeholder.configure({ placeholder }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      ImageExtension.configure({ inline: false }),
      UnderlineExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[180px] px-0 py-2 text-sm text-gray-700 dark:text-gray-300",
        spellcheck: "true",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (value !== currentHtml) {
      editor.commands.setContent(value || "")
    }
  }, [editor, value])

  useEffect(() => {
    if (showLinkInput) linkInputRef.current?.focus()
  }, [showLinkInput])

  useEffect(() => {
    if (showImageInput) imageInputRef.current?.focus()
  }, [showImageInput])

  const handleLinkSubmit = useCallback(() => {
    if (!editor || !linkUrl) return
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    setLinkUrl("")
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const handleLinkRemove = useCallback(() => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    setShowLinkInput(false)
  }, [editor])

  const handleImageSubmit = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
    setShowImageInput(false)
  }, [editor, imageUrl])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      editor.chain().focus().setImage({ src: url }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }, [editor])

  const insertEmoji = useCallback((emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run()
    setShowEmojiPicker(false)
  }, [editor])

  if (!editor) return null

  const toolbarButton = (onClick: () => void, isActive: boolean | null, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isActive ? "bg-gray-200 dark:bg-gray-700" : ""}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )

  const iconClass = "h-3.5 w-3.5 text-gray-500"

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-wrap">
        {toolbarButton(() => editor.chain().focus().undo().run(), null, <Undo2 className={iconClass} />, "Undo (Ctrl+Z)")}
        {toolbarButton(() => editor.chain().focus().redo().run(), null, <Redo2 className={iconClass} />, "Redo (Ctrl+Y)")}

        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        {toolbarButton(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), <Bold className={iconClass} />, "Bold (Ctrl+B)")}
        {toolbarButton(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), <Italic className={iconClass} />, "Italic (Ctrl+I)")}
        {toolbarButton(() => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), <Underline className={iconClass} />, "Underline (Ctrl+U)")}

        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        {toolbarButton(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), <Heading className={iconClass} />, "Heading")}
        {toolbarButton(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), <List className={iconClass} />, "Bullet list")}
        {toolbarButton(() => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"), <Code className={iconClass} />, "Code block")}
        {toolbarButton(() => editor.chain().focus().setHorizontalRule().run(), null, <Minus className={iconClass} />, "Horizontal rule")}

        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        {toolbarButton(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), editor.isActive("table"), <TableIcon className={iconClass} />, "Insert table")}
        {editor.isActive("table") && (
          <>
            {toolbarButton(() => editor.chain().focus().addColumnBefore().run(), null, <TableIcon className={iconClass} />, "Add column before")}
            {toolbarButton(() => editor.chain().focus().addRowAfter().run(), null, <TableIcon className={iconClass} />, "Add row after")}
            {toolbarButton(() => editor.chain().focus().deleteColumn().run(), null, <Trash2 className={iconClass} />, "Delete column")}
            {toolbarButton(() => editor.chain().focus().deleteRow().run(), null, <Trash2 className={iconClass} />, "Delete row")}
            {toolbarButton(() => editor.chain().focus().deleteTable().run(), null, <Trash2 className={iconClass} />, "Delete table")}
          </>
        )}

        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="relative">
          {toolbarButton(() => setShowLinkInput(!showLinkInput), editor.isActive("link"), <Link className={iconClass} />, "Insert link")}
          {showLinkInput && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLinkInput(false)} />
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 p-2 flex gap-1">
                <input
                  ref={linkInputRef}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLinkSubmit(); if (e.key === "Escape") setShowLinkInput(false) }}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleLinkSubmit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
                {editor.isActive("link") && (
                  <button onClick={handleLinkRemove} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          {toolbarButton(() => setShowImageInput(!showImageInput), null, <Image className={iconClass} />, "Insert image")}
          {showImageInput && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowImageInput(false)} />
              <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 p-2 space-y-2">
                <div className="flex gap-1">
                  <input
                    ref={imageInputRef}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleImageSubmit(); if (e.key === "Escape") setShowImageInput(false) }}
                    placeholder="Image URL..."
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={handleImageSubmit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-400">or</span>
                  <label className="ml-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                    Upload file
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          {toolbarButton(() => setShowEmojiPicker(!showEmojiPicker), null, <Smile className={iconClass} />, "Insert emoji")}
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
              <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 p-2">
                <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-lg leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <EditorContent editor={editor} className="px-3" />
    </div>
  )
}
