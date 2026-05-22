import React from 'react';

export default function Preview() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm min-h-[600px]">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-600">Slide Preview</h2>
        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">16:9</span>
      </div>
      
      {/* PPT Canvas Area */}
      <div className="flex flex-1 items-center justify-center bg-[#f8f9fa] p-4 md:p-8 overflow-auto">
        
        {/* The Slide Wrapper to maintain aspect ratio */}
        <div className="relative w-full max-w-4xl aspect-[16/9] shrink-0 overflow-hidden rounded bg-white shadow-md ring-1 ring-gray-900/5">
          {/* Simulated Background */}
          <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
          
          <div className="relative flex h-full flex-col p-8 md:p-12 lg:p-16">
            
            {/* Year Tag */}
            <div className="mb-4 lg:mb-8 self-end rounded-full bg-[#E02424] px-4 py-1.5 text-xs md:text-sm font-bold tracking-wider text-white shadow-sm">
              SSC CGL 2023
            </div>

            {/* Question */}
            <div className="mb-8 lg:mb-12 text-xl md:text-[24pt] font-semibold text-black leading-relaxed">
              प्रश्न 1. निम्नलिखित में से कौन सा शहर गंगा नदी के तट पर स्थित नहीं है?
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4 md:gap-6 text-lg md:text-[20pt] text-black">
              <div className="flex items-center gap-4">
                <span className="font-bold w-8">A.</span>
                <span>कानपुर</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-8">B.</span>
                <span>पटना</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-8">C.</span>
                <span>वाराणसी</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-green-50 px-4 py-2 text-green-800 -ml-4 ring-1 ring-green-500/20">
                <span className="font-bold w-4 md:w-8">D.</span>
                <span>लखनऊ</span>
                <span className="ml-auto text-sm font-medium opacity-80 flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  उत्तर
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
