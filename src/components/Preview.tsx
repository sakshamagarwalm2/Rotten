import React from 'react';

type PreviewProps = {
  backgroundImage: string | null;
};

export default function Preview({ backgroundImage }: PreviewProps) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111111]">Slide Preview</h2>
        <span className="rounded-full border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-1 text-xs font-medium text-[#6b7280]">
          16:9
        </span>
      </div>

      {/* Preview Container */}
      <div className="flex flex-1 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-8">
        
        {/* Slide */}
        <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 overflow-hidden rounded-xl bg-white shadow-lg" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            
            {/* Background */}
            {backgroundImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#f5f5f5]"></div>
            )}
            
            {/* Content */}
            <div className="relative flex h-full flex-col p-12">
              
              {/* Year Tag */}
              <div className="mb-6 self-end">
                <span className="inline-block rounded-full bg-[#e02424] px-4 py-1.5 text-sm font-semibold text-white">
                  SSC CGL 2023
                </span>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold leading-relaxed text-[#111111]">
                  प्रश्न 1. निम्नलिखित में से कौन सा शहर गंगा नदी के तट पर स्थित नहीं है?
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-4 text-lg text-[#374151]">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-[#111111]">A.</span>
                  <span>कानपुर</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-[#111111]">B.</span>
                  <span>पटना</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-[#111111]">C.</span>
                  <span>वाराणसी</span>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-[#f0fdf4] px-4 py-3 -ml-4">
                  <span className="font-semibold text-[#10b981]">D.</span>
                  <span className="text-[#10b981]">लखनऊ</span>
                  <span className="ml-auto flex items-center gap-1 text-sm font-medium text-[#10b981]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    उत्तर
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
