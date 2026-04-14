const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { parse: parseCSV } = require("csv-parse/sync");

/**
 * Validate PDF magic bytes
 */
const isPDF = (buffer) =>
  buffer.length >= 4 && buffer.slice(0, 4).toString() === "%PDF";

/**
 * Validate DOCX magic bytes (ZIP/PK format)
 */
const isDOCX = (buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  buffer[2] === 0x03 &&
  buffer[3] === 0x04;

/**
 * Extract text from PDF buffer
 */
const extractPDF = async (buffer, fileName) => {
  if (!isPDF(buffer)) {
    throw new Error(`Invalid PDF file: ${fileName}`);
  }

  try {
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF appears to be empty or contains only images/scanned content.");
    }

    console.log(`✅ PDF extracted: ${data.numpages} pages, ${data.text.length} chars`);
    return data.text;
  } catch (pdfErr) {
    if (pdfErr.message.includes("XRef") || pdfErr.message.includes("FormatError")) {
      throw new Error(`PDF Parsing Error: This file appears to be corrupted or malformed (${pdfErr.message}). Try "Export to PDF" again from the source.`);
    }
    throw pdfErr;
  }
};

/**
 * Extract text from DOCX buffer
 */
const extractDOCX = async (buffer) => {
  if (!isDOCX(buffer)) {
    throw new Error("Invalid DOCX file signature");
  }

  const result = await mammoth.extractRawText({ buffer });

  if (!result.value || result.value.trim().length === 0) {
    throw new Error("DOCX appears to be empty");
  }

  console.log(`✅ DOCX extracted: ${result.value.length} chars`);
  return result.value;
};

/**
 * Extract text from CSV buffer
 */
const extractCSV = (buffer) => {
  const content = buffer.toString("utf-8");

  // Validate it parses as CSV
  parseCSV(content, { skip_empty_lines: true, relax_quotes: true });

  if (!content || content.trim().length === 0) {
    throw new Error("CSV file is empty");
  }

  console.log(`✅ CSV extracted: ${content.length} chars`);
  return content;
};

/**
 * Extract text from plain TXT buffer
 */
const extractTXT = (buffer) => {
  const content = buffer.toString("utf-8");

  if (!content || content.trim().length === 0) {
    throw new Error("TXT file is empty");
  }

  console.log(`✅ TXT extracted: ${content.length} chars`);
  return content;
};

/**
 * Main dispatcher
 */
const extractText = async (buffer, fileName, mimeType) => {
  const ext = path.extname(fileName).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") {
    return await extractPDF(buffer, fileName);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    return await extractDOCX(buffer);
  }

  if (mimeType === "text/csv" || ext === ".csv") {
    return extractCSV(buffer);
  }

  if (mimeType === "text/plain" || ext === ".txt") {
    return extractTXT(buffer);
  }

  throw new Error(`Unsupported type: ${mimeType || ext}. Use PDF, DOCX, CSV, or TXT.`);
};

module.exports = { extractText };
