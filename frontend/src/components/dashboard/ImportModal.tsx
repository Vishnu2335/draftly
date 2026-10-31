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
    <div className="fixed inset-0 bg-forest-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-warmStone shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sage/20 text-sage-dark flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-forest text-lg">
                Import Document
              </h3>
              <p className="text-xs text-forest/60">
                Word (.docx), Markdown (.md), or Plain Text (.txt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-forest/40 hover:text-forest disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-forest bg-sage/10 scale-[0.99]"
                : "border-warmStone hover:border-forest/50 hover:bg-ivory/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-ivory border border-warmStone text-sage-dark flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-semibold text-forest text-sm mb-1">
              Click to browse or drop your file here
            </h4>
            <p className="text-xs text-forest/50 font-light mb-4">
              Imports preserve headings, bold, italic, underline, and lists.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ivory border border-warmStone text-[11px] font-mono text-forest/70">
              <span>Max file size: 10 MB</span>
            </div>
          </div>
        ) : (
          /* Selected File Preview Card */
          <div className="p-4 rounded-2xl bg-ivory border border-warmStone flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-sage" />
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-forest text-sm truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-forest/50 font-mono">
                  {formatFileSize(selectedFile.size)} • Ready for import
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="p-1.5 rounded-lg text-forest/40 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-warmStone/60 text-xs">
          <div className="text-forest/50 font-mono">
            Supported: .txt, .md, .docx
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl border border-warmStone text-xs font-semibold text-forest hover:bg-ivory transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-dark text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-40"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUploading ? "Importing Document..." : "Import & Open in Atelier"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

