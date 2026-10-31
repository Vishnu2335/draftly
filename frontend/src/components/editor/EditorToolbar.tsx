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
    <div className="bg-white border border-warmStone/80 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center gap-1">
      {/* History Group */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-forest/70 hover:text-forest hover:bg-ivory disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-forest/70 hover:text-forest hover:bg-ivory disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-warmStone/70 mx-1" />

      {/* Headings & Paragraph */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("paragraph") && !editor.isActive("heading")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Normal Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-warmStone/70 mx-1" />

      {/* Inline Marks: Bold, Italic, Underline */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive("bold")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive("italic")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive("underline")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-warmStone/70 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive("bulletList")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive("orderedList")
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-warmStone/70 mx-1" />

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-forest text-white"
              : "text-forest/70 hover:text-forest hover:bg-ivory"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

