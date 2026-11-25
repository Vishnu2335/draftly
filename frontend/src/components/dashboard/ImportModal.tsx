"use client";

import React, { useRef, useState } from "react";
import { apiImportDocument, DocumentItem } from "@/lib/config";
import {
  AlertCircle,
  FileCheck,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onImportSuccess: (doc: DocumentItem) => void;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = [".txt", ".md", ".docx"];

export default function ImportModal({
  isOpen,
  onClose,
  token,
  onImportSuccess,
}: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);

    // Extension check
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMsg(`Unsupported file format '${ext}'. Please choose a .txt, .md, or .docx file.`);
      return;
    }

    // Size check
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    // Empty check
    if (file.size === 0) {
      setErrorMsg("The selected file is empty (0 bytes).");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token || isUploading) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const doc = await apiImportDocument(token, selectedFile);
      onImportSuccess(doc);
    } catch (err: any) {
      setErrorMsg(err.message || "Import failed. Please verify file integrity.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-paper-light rounded-sm max-w-lg w-full p-6 sm:p-8 border-2 border-ink-border shadow-retro-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-ink-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center shadow-retro">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-ink text-base tracking-tight">
                Import Document
              </h3>
              <p className="text-xs text-ink-muted font-medium">
                Word (.docx), Markdown (.md), or Plain Text (.txt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-sm bg-coral-light border-2 border-ink-border text-xs text-ink flex items-start gap-2.5 shadow-retro font-medium">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-ink-border bg-coral-light scale-[0.99]"
                : "border-ink-border bg-paper-cream/40 hover:bg-paper-cream/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-sm bg-paper-light border-2 border-ink-border text-coral flex items-center justify-center mx-auto mb-3 shadow-retro">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-ink text-sm mb-1">
              Click to browse or drop your file here
            </h4>
            <p className="text-xs text-ink-muted font-medium mb-4">
              Imports preserve headings, bold, italic, underline, and lists.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-paper-light border-2 border-ink-border text-[11px] font-bold text-ink shadow-[1px_1px_0px_#171717]">
              <span>Max file size: 10 MB</span>
            </div>
          </div>
        ) : (
          /* Selected File Preview Card */
          <div className="p-4 rounded-sm bg-paper-cream/60 border-2 border-ink-border flex items-center justify-between gap-3 shadow-retro">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#171717]">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink text-sm truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-ink-muted font-mono font-medium">
                  {formatFileSize(selectedFile.size)} • Ready for import
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="p-1.5 rounded-sm text-ink-muted hover:text-coral hover:bg-coral-light border border-transparent hover:border-ink-border transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-ink-border text-xs">
          <div className="text-ink-muted font-bold">
            Supported: .txt, .md, .docx
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-sm border-2 border-ink-border text-xs font-bold text-ink bg-paper-light hover:bg-paper-cream shadow-retro transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border-2 border-ink-border shadow-retro flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUploading ? "Importing Document..." : "Import Document"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
