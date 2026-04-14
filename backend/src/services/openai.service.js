const OpenAI = require("openai");

/**
 * Create and return a standard OpenAI client using the user's decrypted API key.
 * @param {string} apiKey - plaintext OpenAI API key
 * @returns {OpenAI}
 */
const getClient = (apiKey) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  return new OpenAI({ apiKey });
};

module.exports = { getClient };
