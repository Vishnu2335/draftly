"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

import EditorToolbar from "./EditorToolbar";
import { apiUpdateDocument } from "@/lib/config";
import { AlertCircle, Check, Clock, Eye, Loader2, Save } from "lucide-react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface DraftlyEditorProps {
  documentId: string;
  initialContent: Record<string, any>;
  token: string;
  readOnly?: boolean;
  onStatusChange?: (status: SaveStatus) => void;
}

export default function DraftlyEditor({
  documentId,
  initialContent,
  token,
  readOnly = false,
  onStatusChange,
}: DraftlyEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [stats, setStats] = useState<{ words: number; chars: number }>({
    words: 0,
    chars: 0,
  });

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const latestContentRef = useRef<Record<string, any>>(initialContent);

  const updateStatus = (newStatus: SaveStatus) => {
    setSaveStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  // Perform persistent save to backend
  const executeSave = useCallback(async () => {
    if (!token || isSavingRef.current) return;

    isSavingRef.current = true;
    updateStatus("saving");

    try {
      const contentToSave = latestContentRef.current;
      await apiUpdateDocument(token, documentId, {
        content: contentToSave,
      });
      updateStatus("saved");
    } catch (err) {
      console.error("Autosave failed:", err);
      updateStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [token, documentId]);

  // Debounced autosave schedule (1200ms after user pauses typing)
  const scheduleAutosave = useCallback(
    (newContent: Record<string, any>) => {
      if (readOnly) return;

      latestContentRef.current = newContent;
      updateStatus("unsaved");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        executeSave();
      }, 1200);
    },
    [executeSave, readOnly]
  );

  // Initialize Tiptap
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start drafting your manuscript, strategy brief, or notes...",
      }),
    ],
    content: initialContent && initialContent.type ? initialContent : { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none max-w-[760px] mx-auto min-h-[500px] text-forest font-sans leading-relaxed selection:bg-sage/30",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words, chars: text.length });

      scheduleAutosave(json);
    },
  });

  // Update editor editable mode when readOnly prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Calculate initial word and character counts
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words, chars: text.length });
    }
  }, [editor]);

  // Intercept Ctrl+S / Cmd+S for manual immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        executeSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [executeSave]);

  // Unsaved changes navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to exit?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveStatus]);

  return (
    <div className="space-y-6">
      {/* Sticky Formatting & Telemetry Action Bar */}
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-warmStone/70 shadow-xs">
        {readOnly ? (
          <div className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-forest/70 font-mono">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-forest/50" />
              <span>Read-Only Atelier • Viewer Access Mode</span>
            </div>
            <span className="text-[11px] text-forest/50 bg-ivory px-2.5 py-0.5 rounded-full border border-warmStone">
              Content editing locked
            </span>
          </div>
        ) : (
          <>
            <EditorToolbar editor={editor} />

            {/* Save Status & Manual Save Control */}
            <div className="flex items-center gap-3 pr-2">
              {saveStatus === "saving" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-terracotta">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}

              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-sage-dark font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}

              {saveStatus === "unsaved" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-forest/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Unsaved changes</span>
                </span>
              )}

              {saveStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  executeSave();
                }}
                disabled={isSavingRef.current || saveStatus === "saved"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-dark text-white text-xs font-semibold disabled:opacity-40 transition-all shadow-xs"
                title="Manual Save (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Focused 760px Editorial Writing Canvas */}
      <div className="bg-white rounded-3xl p-8 sm:p-14 border border-warmStone shadow-sm min-h-[580px]">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Footer Telemetry: Words, Characters, Autosave Status */}
      <div className="flex items-center justify-between text-xs font-mono text-forest/50 px-3">
        <div className="flex items-center gap-4">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.chars} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Autosave: 1200ms debounce</span>
          <span>•</span>
          <span>Ctrl+S manual override</span>
        </div>
      </div>
    </div>
  );
}
