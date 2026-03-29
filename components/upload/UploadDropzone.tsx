"use client";

import { useCallback, useRef, useState } from "react";
import { useRipple } from "@/hooks/useRipple";

export interface UploadDropzoneProps {
  onFilesChange: (files: File[]) => void;
}

export function UploadDropzone({ onFilesChange }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const ripple = useRipple();

  function addFiles(incoming: FileList | File[]) {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfs.length === 0) return;
    // Deduplicate by name+size
    const merged = [
      ...files,
      ...pdfs.filter(
        (p) => !files.some((e) => e.name === p.name && e.size === p.size)
      ),
    ];
    setFiles(merged);
    onFilesChange(merged);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange(next);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    ripple(e);
    inputRef.current?.click();
  }, [ripple]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      // Reset so same files can be added again if removed
      e.target.value = "";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const hasFiles = files.length > 0;

  return (
    <div className="w-full max-w-[600px] space-y-3">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          glass-panel-base w-full h-[220px] rounded-2xl
          border-2 border-dashed border-white/65
          flex flex-col items-center justify-center gap-4
          transition-all cursor-pointer group relative overflow-hidden
          ${isDragging ? "border-primary scale-[1.01] bg-white/78" : "hover:bg-white/72"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          className={`
            glass-pill-elevated w-14 h-14 rounded-full flex items-center justify-center
            text-primary group-hover:scale-110 transition-transform
            ${isDragging ? "scale-110" : ""}
          `}
        >
          <span className="material-symbols-outlined text-3xl">cloud_upload</span>
        </div>

        <div className="text-center space-y-1 pointer-events-none">
          {hasFiles ? (
            <>
              <p className="text-lg font-semibold text-on-surface">
                {files.length} PDF{files.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-secondary">
                Drop more files or click to add
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-on-surface">
                Drag & drop your slides (PDF)
              </p>
              <p className="text-sm text-on-surface-variant">
                Multiple files supported · Max 50 MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {hasFiles && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}`}
              className="glass-panel-subtle flex items-center gap-3 rounded-xl px-4 py-3"
            >
              <span className="material-symbols-outlined text-primary text-xl">
                picture_as_pdf
              </span>
              <span className="flex-1 text-body-md text-on-surface truncate">
                {file.name}
              </span>
              <span className="text-xs text-outline shrink-0">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-outline hover:text-tertiary hover:bg-tertiary/10 transition-colors shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
