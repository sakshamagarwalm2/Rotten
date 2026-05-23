'use client';

import React, { useState } from 'react';
import SettingsPanel from '../components/SettingsPanel';

export default function HomePage() {
  const [showPreview, setShowPreview] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111]">
              <span className="text-sm font-semibold text-white">R</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#111111]" style={{ letterSpacing: '-0.5px' }}>
              Rotten
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6b7280]">Doc to PPT Converter</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <SettingsPanel 
          onBackgroundChange={setBackgroundImage}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          backgroundImage={backgroundImage}
        />
      </div>

      {/* Footer */}
      <footer className="mt-24 bg-[#101010] py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  <span className="text-sm font-semibold text-[#111111]">R</span>
                </div>
                <span className="text-lg font-semibold tracking-tight text-white" style={{ letterSpacing: '-0.5px' }}>
                  Rotten
                </span>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Save time from non-productive doc to ppt work
              </p>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Resources</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li>User Guide</li>
                <li>API Reference</li>
                <li>Support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-2 text-sm text-[#a1a1aa]">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-[#1a1a1a] pt-8">
            <p className="text-sm text-[#898989]">
              © 2026 Rotten. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
