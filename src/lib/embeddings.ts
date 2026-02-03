import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: process.env.HUGGINGFACE_API_TOKEN!,
});

/**
 * For search queries (single text)
 */
export async function embedText(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}

/**
 * For uploads & scraping (batch texts)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  return embeddings.embedDocuments(texts);
}
