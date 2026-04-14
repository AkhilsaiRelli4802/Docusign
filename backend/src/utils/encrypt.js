const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

// Keys must be set in .env - exactly the right length
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters for AES-256");
  }
  return Buffer.from(key, "utf8");
};

const getIV = () => {
  const iv = process.env.ENCRYPTION_IV;
  if (!iv || iv.length !== 16) {
    throw new Error("ENCRYPTION_IV must be exactly 16 characters");
  }
  return Buffer.from(iv, "utf8");
};

/**
 * Encrypt a plaintext string using AES-256-CBC
 * @param {string} text - plaintext to encrypt
 * @returns {string} - encrypted hex string
 */
const encrypt = (text) => {
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), getIV());
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

/**
 * Decrypt an AES-256-CBC encrypted hex string
 * @param {string} encryptedHex - hex string to decrypt
 * @returns {string} - plaintext
 */
const decrypt = (encryptedHex) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), getIV());
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
