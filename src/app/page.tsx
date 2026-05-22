import React from 'react';
import SettingsPanel from '../components/SettingsPanel';
import Preview from '../components/Preview';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-gray-200">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 md:flex-row md:p-6 lg:p-8 lg:h-screen">
        <SettingsPanel />
        <Preview />
      </div>
    </main>
  );
}
