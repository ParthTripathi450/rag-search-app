import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedTexts } from "@/lib/embeddings";
import mammoth from "mammoth";

// -----------------------------
// Supabase setup
// -----------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// -----------------------------
// Helpers
// -----------------------------
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const PDFParser = (await import("pdf2json")).default;

    return new Promise((resolve, reject) => {
      const parser = new (PDFParser as any)(null, true);

      parser.on("pdfParser_dataError", (err: any) =>
        reject(new Error(err.parserError))
      );

      parser.on("pdfParser_dataReady", (data: any) => {
        let text = "";
        data.Pages?.forEach((page: any) =>
          page.Texts?.forEach((t: any) =>
            t.R?.forEach((r: any) => {
              if (r.T) text += safeDecodeURIComponent(r.T) + " ";
            })
          )
        );
        resolve(text.trim());
      });

      parser.parseBuffer(buffer);
    });
  }

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type");
}

// -----------------------------
// POST /api/upload
// -----------------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const uploadDate = new Date().toISOString();
    const extension = file.name.split(".").pop() || "bin";
    const filePath = `${documentId}.${extension}`;

    // Upload file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await supabase.storage.from("documents").upload(filePath, fileBuffer, {
      contentType: file.type,
    });

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Extract text
    const text = await extractTextFromFile(file);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(text);

    // 🔥 BATCH EMBEDDINGS
    const vectors = await embedTexts(chunks);

    const rows = chunks.map((chunk, i) => ({
      content: chunk,
      embedding: vectors[i],
      metadata: {
        document_id: documentId,
        file_name: file.name,
        file_type: file.type || extension,
        file_size: file.size,
        upload_date: uploadDate,
        chunk_index: i,
        total_chunks: chunks.length,
        file_path: filePath,
        file_url: urlData.publicUrl,
      },
    }));

    // 🔥 SINGLE INSERT
    await supabase.from("documents").insert(rows);

    return NextResponse.json({
      success: true,
      documentId,
      chunks: chunks.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
