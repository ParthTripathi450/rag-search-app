import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";


import mammoth from "mammoth";

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for storage + inserts
const supabase = createClient(supabaseUrl, serviceKey);

// Hugging Face embeddings (384-dim)
const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    apiKey: process.env.HUGGINGFACE_API_TOKEN,
  });
  
// Utility: safe URI decoding (PDF text)
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return decodeURIComponent(str.replace(/%/g, "%25"));
    } catch {
      return str;
    }
  }
}

// Extract text from supported file types
async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    const PDFParser = (await import("pdf2json")).default;

    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, true);

      pdfParser.on("pdfParser_dataError", (err: any) =>
        reject(new Error(`PDF parsing error: ${err.parserError}`))
      );

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          let fullText = "";
          pdfData.Pages?.forEach((page: any) =>
            page.Texts?.forEach((text: any) =>
              text.R?.forEach((r: any) => {
                if (r.T) fullText += safeDecodeURIComponent(r.T) + " ";
              })
            )
          );
          resolve(fullText.trim());
        } catch (e: any) {
          reject(new Error(`Text extraction error: ${e.message}`));
        }
      });

      pdfParser.parseBuffer(buffer);
    });
  }

  if (fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (fileName.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}

// POST /api/upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const documentId = crypto.randomUUID();
    const uploadDate = new Date().toISOString();
    const extension = file.name.split(".").pop() || "bin";
    const filePath = `${documentId}.${extension}`;

    // Upload file to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: storageError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    // Extract text
    const text = await extractTextFromFile(file);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from file" },
        { status: 400 }
      );
    }

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(text);

    // Generate embeddings and store
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const vector = await embeddings.embedQuery(chunk);

      const { error } = await supabase.from("documents").insert({
        content: chunk,
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
        embedding: vector, // 384-dim float array
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      fileName: file.name,
      chunks: chunks.length,
      textLength: text.length,
      fileUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
