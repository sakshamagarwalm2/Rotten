'use client';

import React, { useState } from 'react';
import UploadBox from './UploadBox';
import ColorPicker from './ColorPicker';
import FontSelector from './FontSelector';

export default function SettingsPanel() {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [questionGap, setQuestionGap] = useState(5);
  const [questionOptionColor, setQuestionOptionColor] = useState('#000000');
  const [yearColor, setYearColor] = useState('#e02424');
  const [showAnswer, setShowAnswer] = useState(true);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!docxFile) {
      setErrorMessage('Please upload a DOCX file first.');
      return;
    }

    setStatusMessage('Uploading files...');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('docx', docxFile);
      if (backgroundFile) {
        formData.append('background', backgroundFile);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Upload failed' }));
        setErrorMessage(body?.error ?? 'Upload request failed.');
        setStatusMessage(null);
        return;
      }

      const result = await response.json();
      setUploadId(result.uploadId);
      setStatusMessage('Upload successful. Ready to generate PPT.');
    } catch (error) {
      setErrorMessage('An error occurred while uploading files.');
      setStatusMessage(null);
    }
  };

  const handleGenerate = async () => {
    if (!uploadId) {
      setErrorMessage('Please upload files before generating the PPT.');
      return;
    }

    setStatusMessage('Generating PPT...');
    setErrorMessage(null);

    const settings = {
      fontSize,
      questionGap,
      questionOptionColor,
      yearColor,
      showAnswer,
      contentArea: {
        top: 0,
        left: 0,
        width: 10,
        height: 5,
      },
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId, settings }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Generation failed' }));
        setErrorMessage(body?.error ?? 'PPT generation failed.');
        setStatusMessage(null);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'presentation.pptx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatusMessage('Presentation generated successfully.');
    } catch (error) {
      setErrorMessage('An error occurred while generating the presentation.');
      setStatusMessage(null);
    }
  };

  return (
    <aside className="flex w-full md:w-80 lg:w-[360px] flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shrink-0 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Presentation Settings</h2>

        <div className="flex flex-col gap-4">
          <UploadBox
            label="Upload DOCX"
            accept=".docx"
            file={docxFile}
            onFileChange={setDocxFile}
          />
          <UploadBox
            label="Upload Background"
            accept="image/png,image/jpg,image/jpeg"
            file={backgroundFile}
            onFileChange={setBackgroundFile}
          />
        </div>

        <button
          type="button"
          onClick={handleUpload}
          className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Upload Files
        </button>

        <div className="h-px w-full bg-gray-100" />

        <FontSelector label="Font Size" value={fontSize} onChange={setFontSize} />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Question Gap</span>
          <input
            type="range"
            className="w-full accent-gray-700"
            min="5"
            max="50"
            value={questionGap}
            onChange={(event) => setQuestionGap(Number(event.target.value))}
          />
          <span className="text-xs text-gray-500">{questionGap} pt gap</span>
        </div>

        <div className="h-px w-full bg-gray-100" />

        <div className="flex flex-col gap-4">
          <ColorPicker label="Question/Option Color" value={questionOptionColor} onChange={setQuestionOptionColor} />
          <ColorPicker label="Year Tag Color" value={yearColor} onChange={setYearColor} />
        </div>

        <label className="flex cursor-pointer items-center gap-3 mt-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
            checked={showAnswer}
            onChange={(event) => setShowAnswer(event.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700 select-none">उत्तर दिखाएँ (Show Answer)</span>
        </label>

        {statusMessage ? <p className="text-sm text-green-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Generate PPT
        </button>
      </div>
    </aside>
  );
}
