import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { embedTexts } from "@/lib/embeddings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

function cleanText(text: string) {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, size = 800, overlap = 150) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const article = $("#mw-content-text .mw-parser-output");
    article.find("table, sup, .reference, .toc, .navbox").remove();

    const paragraphs: string[] = [];

    // ✅ FIX HERE
    article.find("p").each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 200) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length === 0) {
      return NextResponse.json(
        { error: "No readable text extracted" },
        { status: 400 }
      );
    }

    const chunks = paragraphs.flatMap((p) => chunkText(p));
    const vectors = await embedTexts(chunks);

    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const rows = chunks.map((content, i) => ({
      content,
      embedding: vectors[i],
      metadata: {
        document_id: documentId,
        source: url,
        file_name: url,
        file_type: "web",
        upload_date: now,
        chunk_index: i,
        total_chunks: chunks.length,
      },
    }));

    await supabase.from("documents").insert(rows);

    return NextResponse.json({
      success: true,
      documentId,
      chunks: chunks.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Scraping failed" },
      { status: 500 }
    );
  }
}
