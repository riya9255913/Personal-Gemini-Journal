import React, { useState } from "react";
import { Download, Upload, X, FileJson, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { JournalStorage } from "../services/storage";
import { JournalEntry } from "../types";

interface BackupModalProps {
  entries: JournalEntry[];
  onImportComplete: () => void;
  onClose: () => void;
  userId: string;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  entries,
  onImportComplete,
  onClose,
  userId,
}) => {
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleDownloadJSON = () => {
    const jsonStr = JournalStorage.exportJSON(userId);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gemini-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const mdStr = JournalStorage.exportMarkdown(userId);
    const blob = new Blob([mdStr], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gemini-journal-archive-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const count = JournalStorage.importJSON(content, userId);
        setImportNotice(`Successfully imported ${count} entries into your vault.`);
        setImportError(null);
        onImportComplete();
      } catch (err) {
        setImportError((err as Error)?.message || "Failed to parse JSON backup.");
        setImportNotice(null);
      }
    };
    reader.readAsText(file);
  };

  const totalWords = entries.reduce((acc, e) => acc + (e.content ? e.content.split(/\s+/).length : 0), 0);
  const totalReflections = entries.filter((e) => e.reflection).length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Download className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Vault Backup & Export
              </h2>
              <p className="text-xs text-stone-500">
                Data ownership: Export or import your private reflections anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vault Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-center">
              <span className="text-xl font-serif font-semibold text-stone-900 block">
                {entries.length}
              </span>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider">Entries</span>
            </div>
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-center">
              <span className="text-xl font-serif font-semibold text-stone-900 block">
                {totalWords}
              </span>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider">Words</span>
            </div>
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-center">
              <span className="text-xl font-serif font-semibold text-stone-900 block">
                {totalReflections}
              </span>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider">Reflections</span>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2">
              Export Vault Data
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJSON}
                className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex items-start gap-3 group"
              >
                <FileJson className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-stone-900 block">JSON Backup</span>
                  <span className="text-xs text-stone-500">Structured data with AI reflections</span>
                </div>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex items-start gap-3 group"
              >
                <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-stone-900 block">Markdown Book</span>
                  <span className="text-xs text-stone-500">Readable archive for Obsidian / Notion</span>
                </div>
              </button>
            </div>
          </div>

          {/* Import Option */}
          <div className="pt-4 border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2">
              Restore from Backup
            </span>
            <label className="border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-stone-50">
              <Upload className="w-6 h-6 text-stone-400 mb-1" />
              <span className="text-xs font-medium text-stone-700">
                Click or drag JSON backup to import
              </span>
              <span className="text-[11px] text-stone-400 mt-0.5">
                Existing entries with matching IDs will update safely
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
