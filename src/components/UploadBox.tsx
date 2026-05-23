'use client';

import React, { useRef } from 'react';

type UploadBoxProps = {
  label: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export default function UploadBox({ label, accept, file, onFileChange }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    onFileChange(selectedFile);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#374151]">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleClick();
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#e5e7eb] bg-white py-8 transition-colors hover:border-[#111111] hover:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        {file ? (
          <div className="text-center">
            <svg className="mx-auto mb-2 h-8 w-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-[#111111]">{file.name}</p>
            <p className="mt-1 text-xs text-[#6b7280]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto mb-2 h-8 w-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-[#6b7280]">Click to upload</p>
          </div>
        )}
      </div>
    </div>
  );
}
