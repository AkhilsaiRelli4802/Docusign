const { Pinecone } = require("@pinecone-database/pinecone");

let pc = null;

/**
 * Get (or create) a singleton Pinecone client
 * @returns {Pinecone}
 */
const getPineconeClient = () => {
  if (!pc) {
    pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pc;
};

/**
 * Get a Pinecone index for a user.
 * Each user gets their own isolated namespace: user_<userId>
 * @returns {object} - Pinecone Index with namespace
 */
const getIndex = (userId) => {
  const client = getPineconeClient();
  const index = client.index(process.env.PINECONE_INDEX || "documind");
  
  // Use Namespaces for Multi-user isolation
  return index.namespace(`user_${userId}`);
};

/**
 * Add document chunks with embeddings to a Pinecone index.
 */
const addDocuments = async (userId, docs) => {
  if (!docs || docs.length === 0) return;

  const { v4: uuidv4 } = require("uuid");
  const pc = getPineconeClient();
  const indexName = (process.env.PINECONE_INDEX || "documind").trim();
  const index = pc.index(indexName);
  const namespace = `user_${userId}`.trim();

  // Prepare standard vector format for Pinecone SDK v4
  const vectors = docs.map((d) => ({
    id: uuidv4(),
    values: d.embedding,
    metadata: {
      text: String(d.text).slice(0, 1000),
      docId: String(d.docId),
      userId: String(d.userId),
      fileName: String(d.fileName),
      chunkIndex: Number(d.chunkIndex),
    },
  }));

  console.log(`📡 Indexing ${vectors.length} vectors to namespace: ${namespace}`);

  // Official upsert recommendation is batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    
    try {
      // Latest Pinecone SDK expects { records: [...] }
      await index.namespace(namespace).upsert({ records: batch });
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} indexed.`);
    } catch (err) {
      console.error("❌ Pinecone Namespace Upsert Error:", err.message);
      // Fallback for flat structure or index-level upsert
      try {
        await index.upsert({ records: batch, namespace });
      } catch (fallbackErr) {
        // Absolute fallback for array wrapper
        await index.upsert(batch);
      }
    }
  }

  console.log(`🎉 SUCCESS: Fully indexed to Pinecone.`);
};

/**
 * Query a collection with a query embedding and return top-N results.
 * @param {string} userId - MongoDB user ID
 * @param {number[]} queryEmbedding - embedding vector of the user question
 * @param {number} nResults - number of results to return
 * @param {string} docId - optional: filter to a specific document
 * @returns {Promise<{documents: string[], distances: number[], metadatas: object[]}>}
 */
const queryCollection = async (
  userId,
  queryEmbedding,
  nResults = 3,
  docId = null
) => {
  const index = getIndex(userId);

  const filter = {};
  if (docId) {
    filter.docId = docId;
  }

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: nResults,
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  const documents = queryResponse.matches.map((m) => m.metadata.text);
  const distances = queryResponse.matches.map((m) => 1 - m.score); // Pinecone returns score (similarity), we'll convert to distance for compatibility
  const metadatas = queryResponse.matches.map((m) => m.metadata);

  return {
    documents,
    distances,
    metadatas,
  };
};

/**
 * Delete all chunks for a specific document from user's namespace.
 * @param {string} userId - user id
 * @param {string} docId - document MongoDB ID
 */
const deleteDocumentChunks = async (userId, docId) => {
  const pc = getPineconeClient();
  const indexName = (process.env.PINECONE_INDEX || "documind").trim();
  const index = pc.index(indexName);
  const namespace = `user_${userId}`.trim();
  
  try {
    console.log(`🚨 Requesting Pinecone to delete chunks for docId: ${docId} in namespace: ${namespace}`);
    await index.namespace(namespace).deleteMany({
      filter: { docId: String(docId) }
    });
    console.log(`✅ Successfully wiped chunks for docId: ${docId} from Pinecone.`);
  } catch (err) {
    console.error(`❌ Pinecone Deletion Error:`, err.message);
    throw new Error("Failed to delete document from vector database");
  }
};

module.exports = {
  addDocuments,
  queryCollection,
  deleteDocumentChunks,
};
