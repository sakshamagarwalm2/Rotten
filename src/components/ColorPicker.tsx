'use client';

import React, { useState, useRef, useEffect } from 'react';

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const presetColors = [
    '#111111', '#374151', '#6b7280', '#000000',
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#e02424', '#16a34a',
  ];

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-[#374151]">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-3 transition-colors hover:border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
      >
        <div
          className="h-6 w-6 flex-shrink-0 rounded border border-[#e5e7eb]"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-[#111111]">{value.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-lg"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="mb-3">
            <label className="mb-2 block text-xs font-medium text-[#6b7280]">Hex Color</label>
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => {
                if (/^#[0-9A-Fa-f]{6}$/.test(tempValue)) {
                  onChange(tempValue);
                } else {
                  setTempValue(value);
                }
              }}
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-mono text-[#111111] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
              placeholder="#000000"
            />
          </div>

          <div className="mb-3">
            <label className="mb-2 block text-xs font-medium text-[#6b7280]">Presets</label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setTempValue(color);
                  }}
                  className="h-8 w-8 rounded border-2 border-transparent transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
                  style={{
                    backgroundColor: color,
                    borderColor: value === color ? '#111111' : 'transparent',
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[#6b7280]">Custom</label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setTempValue(e.target.value);
              }}
              className="h-10 w-full cursor-pointer rounded-lg border border-[#e5e7eb]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
