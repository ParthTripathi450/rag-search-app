import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const file = url.searchParams.get("file") === "true";
    const view = url.searchParams.get("view") === "true";

    /**
     * ---------------------------------------------------------
     * Download / view original file
     * ---------------------------------------------------------
     */
    if (id && file) {
      const { data, error } = await supabase
        .from("documents")
        .select("metadata")
        .eq("metadata->>document_id", id)
        .limit(1);

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const meta = data[0].metadata;
      const fileName = meta.file_name || "document";
      const fileType = meta.file_type || "application/octet-stream";
      const filePath = meta.file_path;

      const { data: fileData, error: storageError } =
        await supabaseAdmin.storage
          .from("documents")
          .download(filePath);

      if (storageError || !fileData) {
        return NextResponse.json(
          { error: "File not found in storage" },
          { status: 404 }
        );
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": fileType,
          "Content-Disposition": view
            ? `inline; filename="${fileName}"`
            : `attachment; filename="${fileName}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    /**
     * ---------------------------------------------------------
     * Get full document (all chunks combined)
     * ---------------------------------------------------------
     */
    if (id) {
      const { data: chunks, error } = await supabase
        .from("documents")
        .select("content, metadata")
        .eq("metadata->>document_id", id)
        .order("metadata->>chunk_index", { ascending: true });

      if (error || !chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const meta = chunks[0].metadata;

      return NextResponse.json({
        id,
        file_name: meta.file_name,
        file_type: meta.file_type,
        file_size: meta.file_size,
        upload_date: meta.upload_date,
        total_chunks: chunks.length,
        fullText: chunks.map((c: any) => c.content).join("\n\n"),
        file_url: meta.file_url,
        file_path: meta.file_path,
      });
    }

    /**
     * ---------------------------------------------------------
     * List all documents (deduplicated)
     * ---------------------------------------------------------
     */
    const { data, error } = await supabase
      .from("documents")
      .select("metadata");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const documentsMap = new Map<string, any>();

    data?.forEach((row: any) => {
      const m = row.metadata;
      if (m?.document_id && !documentsMap.has(m.document_id)) {
        documentsMap.set(m.document_id, {
          id: m.document_id,
          file_name: m.file_name,
          file_type: m.file_type,
          file_size: m.file_size,
          upload_date: m.upload_date,
          total_chunks: m.total_chunks,
          file_url: m.file_url,
          file_path: m.file_path,
        });
      }
    });

    return NextResponse.json({
      documents: Array.from(documentsMap.values()),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get file path
    const { data } = await supabase
      .from("documents")
      .select("metadata")
      .eq("metadata->>document_id", id)
      .limit(1);

    const filePath = data?.[0]?.metadata?.file_path;

    // Delete from storage
    if (filePath) {
      await supabaseAdmin.storage
        .from("documents")
        .remove([filePath]);
    }

    // Delete all chunks
    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("metadata->>document_id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileDeleted: Boolean(filePath),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}
