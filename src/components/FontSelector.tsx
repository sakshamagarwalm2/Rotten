'use client';

import React from 'react';

type FontSelectorProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export default function FontSelector({ label, value, onChange }: FontSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition-shadow focus:border-gray-300 focus:shadow-md cursor-pointer"
      >
        <option value="16">16pt (Small)</option>
        <option value="24">24pt (Medium)</option>
        <option value="32">32pt (Large)</option>
        <option value="40">40pt (Extra Large)</option>
      </select>
    </div>
  );
}
