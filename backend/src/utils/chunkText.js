/**
 * Split text into overlapping chunks for better RAG context.
 * @param {string} text - full document text
 * @param {number} chunkSize - max characters per chunk
 * @param {number} overlap - characters to overlap between chunks
 * @returns {string[]} - array of text chunks
 */
const chunkText = (text, chunkSize = 500, overlap = 100) => {
  const chunks = [];
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length === 0) return chunks;

  let start = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    let chunk = cleanText.slice(start, end);

    // Try to break at a sentence/word boundary to avoid cutting mid-sentence
    if (end < cleanText.length) {
      const lastPeriod = chunk.lastIndexOf(". ");
      const lastNewline = chunk.lastIndexOf("\n");
      const lastSpace = chunk.lastIndexOf(" ");
      const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);

      if (breakPoint > chunkSize * 0.5) {
        chunk = cleanText.slice(start, start + breakPoint + 1);
      }
    }

    chunks.push(chunk.trim());

    // Move forward with overlap so context is not lost between chunks
    start += Math.max(chunk.length - overlap, 1);
  }

  return chunks.filter((c) => c.length > 10); // discard tiny fragments
};

module.exports = { chunkText };
