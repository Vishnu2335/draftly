"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* History Group */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-sm text-ink hover:text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-sm text-ink hover:text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[2px] bg-ink-border mx-1" />

      {/* Headings & Paragraph */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 1 })
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-sm text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
            editor.isActive("paragraph") && !editor.isActive("heading")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Normal Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[2px] bg-ink-border mx-1" />

      {/* Inline Marks: Bold, Italic, Underline */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive("underline")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[2px] bg-ink-border mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[2px] bg-ink-border mx-1" />

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "left" })
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "center" })
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "right" })
              ? "bg-ink text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
              : "text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
