'use client';

import React from 'react';

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-200 shadow-sm shrink-0">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 w-12 -translate-x-2 -translate-y-2 cursor-pointer border-none bg-transparent"
          />
        </div>
        <span className="text-sm text-gray-500 uppercase">{value}</span>
      </div>
    </div>
  );
}
