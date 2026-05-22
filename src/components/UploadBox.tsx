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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleClick();
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-6 transition-colors hover:bg-gray-100 focus:outline-none"
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
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Click to select a file</span>
        )}
      </div>
    </div>
  );
}
