/**
 * Create a text embedding using OpenAI's text-embedding-3-small model.
 * @param {OpenAI} client - OpenAI client instance
 * @param {string} text - text to embed
 * @returns {Promise<number[]>} - embedding vector
 */
const createEmbedding = async (client, text) => {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
};

/**
 * Create embeddings for multiple texts in batch.
 * @param {OpenAI} client - OpenAI client instance
 * @param {string[]} texts - array of texts to embed
 * @returns {Promise<number[][]>} - array of embedding vectors
 */
const createEmbeddings = async (client, texts) => {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  // Sort by index to maintain original order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
};

module.exports = { createEmbedding, createEmbeddings };
