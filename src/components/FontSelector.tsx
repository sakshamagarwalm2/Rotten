'use client';

import React from 'react';

type FontSelectorProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function FontSelector({ label, value, onChange, min = 12, max = 48 }: FontSelectorProps) {
  const generateOptions = () => {
    const options = [];
    const step = 4;
    for (let size = min; size <= max; size += step) {
      options.push(size);
    }
    if (!options.includes(max)) {
      options.push(max);
    }
    return options;
  };

  const options = generateOptions();

  const getSizeLabel = (size: number) => {
    if (size <= 16) return 'Small';
    if (size <= 24) return 'Medium';
    if (size <= 32) return 'Large';
    if (size <= 40) return 'Extra Large';
    return 'Huge';
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#374151]">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full appearance-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111111] transition-colors hover:border-[#111111] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}pt — {getSizeLabel(size)}
          </option>
        ))}
      </select>
    </div>
  );
}
