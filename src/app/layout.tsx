import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOCX to PPT Converter',
  description: 'A scaffolded Next.js app for DOCX-to-PPT conversion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
