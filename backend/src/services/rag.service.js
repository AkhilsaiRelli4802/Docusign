const pineconeService = require("./pinecone.service.js");
const embeddingService = require("./embedding.service.js");

/**
 * Perform a RAG query: query embedding -> retrieve from Pinecone -> check similarity threshold
 * @param {object} client - OpenAI client instance
 * @param {string} userId - MongoDB user ID
 * @param {string} question - the user's question
 * @param {number} threshold - distance threshold (cosine similarity based: closer to 0 is more similar in distances, but usually similarity is 1-distance)
 * @returns {Promise<{relevantContext: string | null, similarity: number}>}
 */
const queryRAG = async (client, userId, question, threshold = 0.75) => {
  // 1. Create embedding for the question
  const queryEmbedding = await embeddingService.createEmbedding(client, question);

  // 2. Search Pinecone
  const { documents, distances } = await pineconeService.queryCollection(
    userId,
    queryEmbedding,
    3
  );

  if (documents.length === 0) {
    return { relevantContext: null, similarity: 0 };
  }

  // Pinecone similarity score: 1 is identical.
  // We already converted it to "distance" (1-score) in pinecone.service.js for compatibility.
  const topDistance = distances[0];
  const similarityScore = 1 - topDistance;

  console.log(`🔍 RAG Similarity Score: ${similarityScore.toFixed(4)} (Threshold: ${threshold})`);

  if (similarityScore >= threshold) {
    return {
      relevantContext: documents.join("\n\n---\n\n"),
      similarity: similarityScore,
    };
  }

  return { relevantContext: null, similarity: similarityScore };
};

module.exports = { queryRAG };
