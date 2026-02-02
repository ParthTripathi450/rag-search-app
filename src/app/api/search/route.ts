import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Supabase client (read-only access is enough here)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hugging Face embeddings (must match upload route + DB schema)
const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: process.env.HUGGINGFACE_API_TOKEN!,
});

// Gemini model (free tier)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Generate embedding for the user's query
    const queryEmbedding = await embeddings.embedQuery(query);

    // 2️⃣ Retrieve similar document chunks using pgvector
    const { data: results, error } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.2, // adjust for stricter/looser matching
        match_count: 5,       // top 5 relevant chunks
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json({
        answer: "I could not find relevant information in the uploaded documents.",
        sources: [],
      });
    }

    // 3️⃣ Build context from retrieved chunks
    const context = results
      .map((r: any, i: number) => `Chunk ${i + 1}:\n${r.content}`)
      .join("\n\n---\n\n");

    // 4️⃣ Generate answer using Gemini
    const response = await llm.invoke([
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer ONLY using the provided context. " +
          "If the answer cannot be found in the context, say you do not know.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${query}`,
      },
    ]);

    return NextResponse.json({
      answer: response.content,
      sources: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
