'use client';

import React, { useState, useEffect } from 'react';
import UploadBox from './UploadBox';
import ColorPicker from './ColorPicker';
import FontSelector from './FontSelector';
import Preview from './Preview';
import { defaultSettings } from '../constants/defaultSettings';

type SettingsPanelProps = {
  onBackgroundChange: (imageUrl: string | null) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  backgroundImage: string | null;
};

export default function SettingsPanel({ onBackgroundChange, showPreview, onTogglePreview, backgroundImage }: SettingsPanelProps) {
  // File States
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  
  // Text Size Settings
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [headingFontSize, setHeadingFontSize] = useState(defaultSettings.headingFontSize);
  
  // Spacing Settings
  const [horizontalMargin, setHorizontalMargin] = useState(defaultSettings.horizontalMargin);
  const [verticalMargin, setVerticalMargin] = useState(defaultSettings.verticalMargin);
  const [lineSpacing, setLineSpacing] = useState(defaultSettings.lineSpacing);
  
  // Color Settings
  const [questionNoOptionNoColor, setQuestionNoOptionNoColor] = useState(defaultSettings.questionNoOptionNoColor);
  const [questionOptionColor, setQuestionOptionColor] = useState(defaultSettings.questionOptionColor);
  const [headingColor, setHeadingColor] = useState(defaultSettings.headingColor);
  const [yearColor, setYearColor] = useState(defaultSettings.yearColor);
  const [answerColor, setAnswerColor] = useState(defaultSettings.answerColor);
  
  // Display Options
  const [showAnswer, setShowAnswer] = useState(defaultSettings.showAnswer);
  const [showBulletPoints, setShowBulletPoints] = useState(defaultSettings.showBulletPoints);
  const [bulletStyle, setBulletStyle] = useState<'disc' | 'circle' | 'square' | 'number' | 'letters' | 'none'>(defaultSettings.bulletStyle);
  
  // Upload States
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-upload when files change
  useEffect(() => {
    if (docxFile && !isUploading) {
      handleAutoUpload();
    }
  }, [docxFile, backgroundFile]);

  // Update background preview
  useEffect(() => {
    if (backgroundFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onBackgroundChange(e.target?.result as string);
      };
      reader.readAsDataURL(backgroundFile);
    } else {
      onBackgroundChange(null);
    }
  }, [backgroundFile, onBackgroundChange]);

  const handleAutoUpload = async () => {
    if (!docxFile) return;

    setIsUploading(true);
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
        setIsUploading(false);
        return;
      }

      const result = await response.json();
      setUploadId(result.uploadId);
      setStatusMessage('Files uploaded successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setErrorMessage('An error occurred while uploading files.');
      setStatusMessage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!uploadId) {
      setErrorMessage('Please upload files before generating the PPT.');
      return;
    }

    setStatusMessage('Generating presentation...');
    setErrorMessage(null);

    const settings = {
      fontSize,
      headingFontSize,
      horizontalMargin,
      verticalMargin,
      lineSpacing,
      questionNoOptionNoColor,
      questionOptionColor,
      headingColor,
      yearColor,
      answerColor,
      showAnswer,
      showBulletPoints,
      bulletStyle,
      contentArea: {
        top: verticalMargin,
        left: horizontalMargin,
        width: 13.33 - (horizontalMargin * 2),
        height: 7.5 - (verticalMargin * 2),
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
      setStatusMessage('Presentation generated successfully');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setErrorMessage('An error occurred while generating the presentation.');
      setStatusMessage(null);
    }
  };

  return (
    <div className="flex w-full flex-col transition-all duration-300">
      
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111111]" style={{ letterSpacing: '-1px' }}>
            Presentation Settings
          </h1>
          <p className="mt-2 text-base text-[#6b7280]">
            Customize your PowerPoint output
          </p>
        </div>
        
        <button
          type="button"
          onClick={onTogglePreview}
          className="flex h-9 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#111111] transition-colors hover:bg-[#f8f9fa]"
        >
          {showPreview ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Hide
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Show
            </>
          )}
        </button>
      </div>

      {/* Preview — sits at top of dashboard area below header */}
      {showPreview && (
        <div className="mb-6">
          <Preview 
            backgroundImage={backgroundImage} 
            fontSize={fontSize}
            headingFontSize={headingFontSize}
            lineSpacing={lineSpacing}
            horizontalMargin={horizontalMargin}
            verticalMargin={verticalMargin}
            questionNoOptionNoColor={questionNoOptionNoColor}
            questionOptionColor={questionOptionColor}
            yearColor={yearColor}
            answerColor={answerColor}
            showAnswer={showAnswer}
            showBulletPoints={showBulletPoints}
            bulletStyle={bulletStyle}
          />
        </div>
      )}

      {/* Form Controls — multi-column grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
        {/* File Upload Section */}
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-6 md:col-span-2 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Files</h2>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <UploadBox
              label="DOCX Document"
              accept=".docx"
              file={docxFile}
              onFileChange={setDocxFile}
            />
            <UploadBox
              label="Background Image"
              accept="image/png,image/jpg,image/jpeg"
              file={backgroundFile}
              onFileChange={setBackgroundFile}
            />
          </div>

          {isUploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#3b82f6]">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          )}
        </div>

        {/* Text Sizes */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Text Sizes</h2>
          
          <div className="space-y-4">
            <FontSelector 
              label="Question Size" 
              value={headingFontSize} 
              onChange={setHeadingFontSize}
              min={16}
              max={60}
            />
            
            <FontSelector 
              label="Content Size" 
              value={fontSize} 
              onChange={setFontSize}
              min={12}
              max={48}
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Spacing</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">Horizontal Margin</label>
              <input
                type="range"
                className="w-full accent-[#111111]"
                min="0"
                max="4"
                step="0.1"
                value={horizontalMargin}
                onChange={(e) => setHorizontalMargin(Number(e.target.value))}
              />
              <span className="mt-1 block text-sm text-[#6b7280]">{horizontalMargin.toFixed(1)} in</span>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">Vertical Margin</label>
              <input
                type="range"
                className="w-full accent-[#111111]"
                min="0"
                max="3"
                step="0.1"
                value={verticalMargin}
                onChange={(e) => setVerticalMargin(Number(e.target.value))}
              />
              <span className="mt-1 block text-sm text-[#6b7280]">{verticalMargin.toFixed(1)} in</span>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#374151]">Line Spacing</label>
              <input
                type="range"
                className="w-full accent-[#111111]"
                min="1"
                max="3"
                step="0.1"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(Number(e.target.value))}
              />
              <span className="mt-1 block text-sm text-[#6b7280]">{lineSpacing.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Colors</h2>
          
          <div className="space-y-4">
            <ColorPicker 
              label="Heading" 
              value={headingColor} 
              onChange={setHeadingColor} 
            />
            
            <ColorPicker 
              label="QuestionNo/OptionNo" 
              value={questionNoOptionNoColor} 
              onChange={setQuestionNoOptionNoColor} 
            />
            
            <ColorPicker 
              label="Question/Option" 
              value={questionOptionColor} 
              onChange={setQuestionOptionColor} 
            />
            
            <ColorPicker 
              label="Year Tag" 
              value={yearColor} 
              onChange={setYearColor} 
            />
            
            <ColorPicker 
              label="Answer" 
              value={answerColor} 
              onChange={setAnswerColor} 
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 md:col-span-2 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Display Options</h2>
          
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#e5e7eb] accent-[#111111]"
                checked={showAnswer}
                onChange={(e) => setShowAnswer(e.target.checked)}
              />
              <span className="text-sm font-medium text-[#374151]">Show Answer</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#e5e7eb] accent-[#111111]"
                checked={showBulletPoints}
                onChange={(e) => setShowBulletPoints(e.target.checked)}
              />
              <span className="text-sm font-medium text-[#374151]">Show Bullet Points</span>
            </label>

            {showBulletPoints && (
              <div className="ml-7">
                <label className="mb-2 block text-sm font-medium text-[#374151]">Bullet Style</label>
                <select
                  value={bulletStyle}
                  onChange={(e) => setBulletStyle(e.target.value as any)}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                >
                  <option value="disc">● Disc</option>
                  <option value="circle">○ Circle</option>
                  <option value="square">■ Square</option>
                  <option value="number">1. Numbers</option>
                  <option value="letters">A. Letters</option>
                  <option value="none">None</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {(statusMessage || errorMessage) && (
          <div className="md:col-span-2 lg:col-span-3">
            {statusMessage && (
              <div className="flex items-center gap-3 rounded-lg border border-[#10b981] bg-[#f0fdf4] px-4 py-3 text-sm text-[#10b981]">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {statusMessage}
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-3 rounded-lg border border-[#ef4444] bg-[#fef2f2] px-4 py-3 text-sm text-[#ef4444]">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!uploadId || isUploading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#111111] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#242424] active:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Generate PowerPoint
        </button>
      </div>
    </div>
  );
}
