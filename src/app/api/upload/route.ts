import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const DOCX_MAX_SIZE = 20 * 1024 * 1024;
const BACKGROUND_MAX_SIZE = 10 * 1024 * 1024;
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'tmp', 'uploads');

export const runtime = 'nodejs';

const UploadResponseSchema = z.object({
  uploadId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const docxEntry = formData.get('docx');

    if (!docxEntry || !(docxEntry instanceof File)) {
      return NextResponse.json({ error: 'Missing .docx file upload under field "docx".' }, { status: 400 });
    }

    if (!docxEntry.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Uploaded file must be a .docx document.' }, { status: 400 });
    }

    if (docxEntry.size > DOCX_MAX_SIZE) {
      return NextResponse.json({ error: 'The DOCX file exceeds the 20 MB maximum size.' }, { status: 400 });
    }

    const backgroundEntry = formData.get('background');
    let backgroundPath: string | null = null;

    if (backgroundEntry !== null) {
      if (!(backgroundEntry instanceof File)) {
        return NextResponse.json({ error: 'Invalid background upload.' }, { status: 400 });
      }

      const bgName = backgroundEntry.name.toLowerCase();
      const validExtensions = ['.png', '.jpg', '.jpeg'];
      const isValidExtension = validExtensions.some((ext) => bgName.endsWith(ext));

      if (!isValidExtension) {
        return NextResponse.json({ error: 'Background file must be PNG, JPG, or JPEG.' }, { status: 400 });
      }

      if (backgroundEntry.size > BACKGROUND_MAX_SIZE) {
        return NextResponse.json({ error: 'The background image exceeds the 10 MB maximum size.' }, { status: 400 });
      }

      const uploadId = randomUUID();
      const uploadDir = path.join(UPLOAD_BASE_DIR, uploadId);
      await fs.mkdir(uploadDir, { recursive: true });

      const docxPath = path.join(uploadDir, 'document.docx');
      const backgroundExtension = path.extname(bgName);
      backgroundPath = path.join(uploadDir, `background${backgroundExtension}`);

      await fs.writeFile(docxPath, Buffer.from(await docxEntry.arrayBuffer()));
      await fs.writeFile(backgroundPath, Buffer.from(await backgroundEntry.arrayBuffer()));

      const metadata = {
        docxPath,
        backgroundPath,
      };
      await fs.writeFile(path.join(uploadDir, 'metadata.json'), JSON.stringify(metadata));

      const responseData = UploadResponseSchema.parse({ uploadId });
      return NextResponse.json(responseData);
    }

    const uploadId = randomUUID();
    const uploadDir = path.join(UPLOAD_BASE_DIR, uploadId);
    await fs.mkdir(uploadDir, { recursive: true });

    const docxPath = path.join(uploadDir, 'document.docx');
    await fs.writeFile(docxPath, Buffer.from(await docxEntry.arrayBuffer()));

    const metadata = { docxPath, backgroundPath: null };
    await fs.writeFile(path.join(uploadDir, 'metadata.json'), JSON.stringify(metadata));

    const responseData = UploadResponseSchema.parse({ uploadId });
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: 'Unable to process upload.' }, { status: 500 });
  }
}
