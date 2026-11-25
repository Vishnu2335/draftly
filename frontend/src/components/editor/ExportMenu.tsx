"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Printer, FileCode, Check } from "lucide-react";

interface ExportMenuProps {
  title: string;
  getContentJson: () => Record<string, any>;
  getTextContent: () => string;
}

export default function ExportMenu({
  title,
  getContentJson,
  getTextContent,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sanitizeFilename = (raw: string) => {
    return raw.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "draftly_document";
  };

  const handleExportText = () => {
    const text = getTextContent() || "";
    const filename = `${sanitizeFilename(title)}.txt`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // Convert Tiptap JSON nodes to basic markdown format
  const convertJsonToMarkdown = (node: any): string => {
    if (!node) return "";
    if (node.type === "text") {
      let t = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") t = `**${t}**`;
          if (mark.type === "italic") t = `*${t}*`;
          if (mark.type === "code") t = `\`${t}\``;
          if (mark.type === "link") t = `[${t}](${mark.attrs?.href || ""})`;
        }
      }
      return t;
    }

    const children = (node.content || []).map(convertJsonToMarkdown).join("");

    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level || 1;
        const prefix = "#".repeat(level);
        return `\n${prefix} ${children}\n\n`;
      }
      case "paragraph":
        return `${children}\n\n`;
      case "bulletList":
        return `\n${children}\n`;
      case "orderedList":
        return `\n${children}\n`;
      case "listItem":
        return `* ${children.trim()}\n`;
      case "blockquote":
        return `> ${children.trim()}\n\n`;
      case "codeBlock":
        return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case "horizontalRule":
        return `\n---\n\n`;
      default:
        return children;
    }
  };

  const handleExportMarkdown = () => {
    const json = getContentJson();
    let md = "";
    if (title) {
      md += `# ${title}\n\n`;
    }
    if (json && json.content) {
      md += (json.content as any[]).map(convertJsonToMarkdown).join("");
    } else {
      md += getTextContent() || "";
    }

    const filename = `${sanitizeFilename(title)}.md`;
    const blob = new Blob([md.trim()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleExportPdf = () => {
    setIsOpen(false);
    // Use window.print() which renders with retro editorial styling via @media print
    window.print();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        title="Export document in multiple formats"
      >
        <Download className="w-3.5 h-3.5 text-coral" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white border-2 border-ink-border rounded-sm shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted border-b border-ink-border/20">
            Export Document
          </div>

          <button
            onClick={handleExportPdf}
            className="w-full text-left px-3 py-2 text-xs font-bold text-ink hover:bg-paper-light flex items-center gap-2 cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-coral shrink-0" />
            <div>
              <div>PDF Document</div>
              <div className="text-[10px] text-ink-muted font-normal">Print to PDF ready</div>
            </div>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="w-full text-left px-3 py-2 text-xs font-bold text-ink hover:bg-paper-light flex items-center gap-2 cursor-pointer transition"
          >
            <FileCode className="w-4 h-4 text-retroGreen shrink-0" />
            <div>
              <div>Markdown (.md)</div>
              <div className="text-[10px] text-ink-muted font-normal">Formatted text file</div>
            </div>
          </button>

          <button
            onClick={handleExportText}
            className="w-full text-left px-3 py-2 text-xs font-bold text-ink hover:bg-paper-light flex items-center gap-2 cursor-pointer transition"
          >
            <FileText className="w-4 h-4 text-ink-muted shrink-0" />
            <div>
              <div>Plain Text (.txt)</div>
              <div className="text-[10px] text-ink-muted font-normal">Unformatted raw text</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
