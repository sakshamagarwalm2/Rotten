import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { PptSettingsSchema, type PptSettings } from '../../../types/settings';
import { parseDoc } from '../../../services/docParser/parseDoc';
import { normalizeDoc } from '../../../services/docParser/normalizeDoc';
import { calculateLayout } from '../../../services/layoutEngine/calculateLayout';
import { generatePpt } from '../../../services/pptGenerator/generatePpt';

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'tmp', 'uploads');

export const runtime = 'nodejs';

const GenerateRequestSchema = z.object({
  uploadId: z.string().uuid(),
  settings: PptSettingsSchema,
});

export async function POST(request: Request) {
  console.log("");
  console.log("========================================");
  console.log("[generate/route] POST handler ENTER");
  console.log("[generate/route] request.url:", request.url);
  console.log("[generate/route] request.method:", request.method);

  try {
    console.log("[generate/route] Reading request body...");
    const body = await request.json();
    console.log("[generate/route] Raw body received:", JSON.stringify(body, null, 2));
    console.log("[generate/route] body keys:", Object.keys(body));
    console.log("[generate/route] body.uploadId:", body.uploadId);
    console.log("[generate/route] body.uploadId type:", typeof body.uploadId);
    console.log("[generate/route] body.settings present:", !!body.settings);
    console.log("[generate/route] body.settings keys:", body.settings ? Object.keys(body.settings) : "N/A");

    console.log("[generate/route] Parsing with Zod schema...");
    const parsed = GenerateRequestSchema.parse(body);
    const { uploadId, settings } = parsed;
    console.log("[generate/route] Zod parse SUCCEEDED");
    console.log("[generate/route] uploadId:", uploadId);
    console.log("[generate/route] settings:", JSON.stringify(settings, null, 2));
    console.log("[generate/route] settings.backgroundImage (from client):", settings.backgroundImage);
    console.log("[generate/route] settings.backgroundImage type:", typeof settings.backgroundImage);
    if (settings.backgroundImage && typeof settings.backgroundImage !== 'string') {
      console.error("[generate/route] *** WARNING: client sent backgroundImage as non-string:", typeof settings.backgroundImage);
      console.error("[generate/route] *** constructor:", (settings.backgroundImage as any)?.constructor?.name);
    }

    const uploadDir = path.join(UPLOAD_BASE_DIR, uploadId);
    const metadataPath = path.join(uploadDir, 'metadata.json');
    console.log("[generate/route] UPLOAD_BASE_DIR:", UPLOAD_BASE_DIR);
    console.log("[generate/route] uploadDir:", uploadDir);
    console.log("[generate/route] metadataPath:", metadataPath);
    console.log("[generate/route] uploadDir exists:", await fs.access(uploadDir).then(() => true).catch(() => false));
    console.log("[generate/route] metadataPath exists:", await fs.access(metadataPath).then(() => true).catch(() => false));

    console.log("[generate/route] Reading metadata.json...");
    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    console.log("[generate/route] metadata.json raw content:", metadataRaw);
    const metadata = JSON.parse(metadataRaw) as {
      docxPath: string;
      backgroundPath: string | null;
    };
    console.log("[generate/route] parsed metadata:", JSON.stringify(metadata, null, 2));
    console.log("[generate/route] metadata.docxPath:", metadata.docxPath);
    console.log("[generate/route] metadata.docxPath type:", typeof metadata.docxPath);
    console.log("[generate/route] metadata.docxPath exists:", await fs.access(metadata.docxPath).then(() => true).catch(() => false));
    console.log("[generate/route] metadata.backgroundPath:", metadata.backgroundPath);
    console.log("[generate/route] metadata.backgroundPath type:", typeof metadata.backgroundPath);

    console.log("[generate/route] Reading DOCX file...");
    console.log("[generate/route] docxPath exists check:", await fs.access(metadata.docxPath).then(() => true).catch(() => false));
    const documentBuffer = await fs.readFile(metadata.docxPath);
    console.log("[generate/route] documentBuffer size:", documentBuffer.length, "bytes");
    console.log("[generate/route] documentBuffer type:", typeof documentBuffer);
    console.log("[generate/route] documentBuffer constructor:", documentBuffer.constructor.name);

    console.log("[generate/route] Calling parseDoc()...");
    const parseResult = await parseDoc(documentBuffer, settings);
    console.log("[generate/route] parseDoc returned");
    console.log("[generate/route] parseResult keys:", Object.keys(parseResult));
    console.log("[generate/route] parseResult sections count:", parseResult.sections?.length);
    console.log("[generate/route] parseResult raw:", JSON.stringify(parseResult, null, 2).substring(0, 2000));

    console.log("[generate/route] Calling normalizeDoc()...");
    const normalizedDocument = normalizeDoc(parseResult);
    console.log("[generate/route] normalizeDoc returned");
    console.log("[generate/route] normalizedDocument keys:", Object.keys(normalizedDocument));
    console.log("[generate/route] normalizedDocument sections count:", normalizedDocument.sections?.length);
    console.log("[generate/route] normalizedDocument (first 2000 chars):", JSON.stringify(normalizedDocument, null, 2).substring(0, 2000));

    console.log("[generate/route] Calling calculateLayout()...");
    const slides = calculateLayout(normalizedDocument, settings);
    console.log("[generate/route] calculateLayout returned");
    console.log("[generate/route] slides count:", slides.length);
    console.log("[generate/route] slides isArray:", Array.isArray(slides));
    if (slides.length > 0) {
      console.log("[generate/route] first slide id:", slides[0].id);
      console.log("[generate/route] first slide items count:", slides[0].items.length);
      console.log("[generate/route] first slide items:", JSON.stringify(slides[0].items, null, 2));
      console.log("[generate/route] last slide id:", slides[slides.length - 1].id);
      console.log("[generate/route] last slide items count:", slides[slides.length - 1].items.length);
    }

    console.log("[generate/route] Checking backgroundPath...");
    console.log("[generate/route] metadata.backgroundPath truthy:", !!metadata.backgroundPath);
    console.log("[generate/route] metadata.backgroundPath value:", metadata.backgroundPath);
    if (metadata.backgroundPath) {
      console.log("[generate/route] backgroundPath exists check:", await fs.access(metadata.backgroundPath).then(() => true).catch(() => false));
      console.log("[generate/route] backgroundPath file size:", await fs.stat(metadata.backgroundPath!).then(s => s.size).catch(() => -1));
      console.log("[generate/route] Assigning metadata.backgroundPath to settings.backgroundImage");
      console.log("[generate/route] settings.backgroundImage BEFORE:", settings.backgroundImage);
      settings.backgroundImage = metadata.backgroundPath;
      console.log("[generate/route] settings.backgroundImage AFTER:", settings.backgroundImage);
      console.log("[generate/route] settings.backgroundImage type AFTER:", typeof settings.backgroundImage);
    } else {
      console.log("[generate/route] metadata.backgroundPath is null/falsy, NOT assigning to settings");
    }

    const outputFilePath = path.join(uploadDir, 'presentation.pptx');
    console.log("[generate/route] outputFilePath:", outputFilePath);
    console.log("[generate/route] output dir exists:", await fs.access(uploadDir).then(() => true).catch(() => false));
    console.log("[generate/route] output file already exists:", await fs.access(outputFilePath).then(() => true).catch(() => false));

    console.log("[generate/route] Calling generatePpt()...");
    console.log("[generate/route] generatePpt arguments:");
    console.log("[generate/route]   slides count:", slides.length);
    console.log("[generate/route]   settings (full):", JSON.stringify(settings, null, 2));
    console.log("[generate/route]   outputFilePath:", outputFilePath);
    const result = await generatePpt(slides, settings, outputFilePath);
    console.log("[generate/route] generatePpt() returned:", result);

    console.log("[generate/route] Reading generated PPTX file...");
    console.log("[generate/route] output file exists AFTER generate:", await fs.access(outputFilePath).then(() => true).catch(() => false));
    const fileBuffer = await fs.readFile(outputFilePath);
    console.log("[generate/route] generated file size:", fileBuffer.length, "bytes");
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });

    console.log("[generate/route] RETURNING response with status 200");
    console.log("========================================");
    return response;
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("");
    console.error("========================================");
    console.error("[generate/route] ERROR CAUGHT");
    console.error("[generate/route] error message:", message);
    console.error("[generate/route] error name:", error?.name || "N/A");
    console.error("[generate/route] error code:", error?.code || "N/A");
    console.error("[generate/route] error stack:", error?.stack || "N/A");
    if (error instanceof z.ZodError) {
      console.error("[generate/route] ZodError issues:", JSON.stringify(error.issues, null, 2));
    }
    if (error && typeof error === 'object') {
      console.error("[generate/route] error all properties:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    console.error("[generate/route] RETURNING 500 response with error:", message);
    console.error("========================================");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
