// OpenAI Embeddings API helper

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export interface EmbeddingResult {
    text: string;
    embedding: number[];
}

// Generate embeddings for texts using OpenRouter API
export async function generateEmbeddings(
    texts: string[],
    apiKey: string,
    options: {
        model?: string;
        dimensions?: number;
        onProgress?: (current: number, total: number) => void;
    } = {}
): Promise<EmbeddingResult[]> {
    // Use text-embedding-3-small (1536 dimensions) to match database schema
    const { model = "openai/text-embedding-3-small", dimensions = 1536, onProgress } = options;

    if (texts.length === 0) return [];

    // OpenRouter (via OpenAI) allows batching, but we'll stick to 50 for safety and progress
    const batchSize = 50;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        onProgress?.(i, texts.length);

        const response = await fetch(`${OPENROUTER_API_BASE}/embeddings`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin, // Required by OpenRouter
                "X-Title": "TubeClone Research", // Optional
            },
            body: JSON.stringify({
                model,
                input: batch,
                // dimensions: removed to ensure compatibility with OpenRouter providers
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Embedding API Error:", response.status, error);
            throw new Error(error.error?.message || `Embedding failed: ${response.status}`);
        }

        const data = await response.json();

        for (let j = 0; j < batch.length; j++) {
            results.push({
                text: batch[j],
                embedding: data.data[j].embedding,
            });
        }
    }

    onProgress?.(texts.length, texts.length);
    return results;
}

// Generate embedding for a single text
export async function generateSingleEmbedding(
    text: string,
    apiKey: string,
    options: { model?: string; dimensions?: number } = {}
): Promise<number[]> {
    const results = await generateEmbeddings([text], apiKey, options);
    return results[0]?.embedding || [];
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find top K most similar items
export function findTopKSimilar<T extends { embedding: number[] }>(
    queryEmbedding: number[],
    items: T[],
    k: number = 10
): Array<T & { similarity: number }> {
    const scored = items.map(item => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    return scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);
}

// Prepare video text for embedding (combine title, description, tags)
export function prepareVideoTextForEmbedding(
    title: string,
    description: string,
    tags: string[]
): string {
    // Truncate description if too long
    const truncatedDesc = description.length > 500
        ? description.substring(0, 500) + "..."
        : description;

    const tagString = tags.slice(0, 20).join(", ");

    return `Title: ${title}\nDescription: ${truncatedDesc}\nTags: ${tagString}`;
}
