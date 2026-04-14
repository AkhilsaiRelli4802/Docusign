const Document = require("../models/document.model");
const User = require("../models/user.model");
const { extractText } = require("../utils/extractText");
const { chunkText } = require("../utils/chunkText");
const { getClient } = require("../services/openai.service");
const { createEmbeddings } = require("../services/embedding.service");
const { addDocuments, deleteDocumentChunks } = require("../services/pinecone.service");
const { decrypt } = require("../utils/encrypt");

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { _id: userId, openaiKey } = req.user;

    if (!openaiKey) {
      return res.status(403).json({ message: "OpenAI API key missing. Please add it first." });
    }

    // 1. Extract text
    const text = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);

    // 2. Metadata Save in MongoDB (status: processing)
    const doc = await Document.create({
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      collectionName: `user_${userId}`,
      status: "processing",
    });

    // 3. Process Embedding & Vector Store
    const client = getClient(decrypt(openaiKey));
    const chunks = chunkText(text);
    console.log(`✂️ Generated ${chunks.length} chunks for indexing.`);

    if (chunks.length === 0) {
      throw new Error("Text extraction succeeded, but no valid content chunks were generated (Empty file?)");
    }

    // Create chunks objects with embeddings
    console.log(`🤖 Requesting embeddings from OpenAI...`);
    const embeddings = await createEmbeddings(client, chunks);

    const docObjects = chunks.map((chunk, index) => ({
      text: chunk,
      embedding: embeddings[index],
      chunkIndex: index,
      docId: doc._id.toString(),
      userId: userId.toString(),
      fileName: doc.fileName,
    }));

    // 4. Store in Pinecone
    await addDocuments(userId, docObjects);

    // 5. Update MongoDB Status
    doc.status = "ready";
    doc.chunkCount = chunks.length;
    await doc.save();

    res.status(201).json({
      message: "Document uploaded and processed successfully",
      document: doc,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n🗑️ Deletion requested for document ID: ${id}`);
    
    const doc = await Document.findOne({ _id: id, userId: req.user._id });

    if (!doc) {
      console.log(`⚠️ Document ${id} not found in MongoDB.`);
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete from Pinecone
    console.log("🧹 Clearing vector embeddings...");
    await deleteDocumentChunks(req.user._id, id);

    // Delete from MongoDB
    await doc.deleteOne();
    console.log(`✅ MongoDB record cleared for ${doc.fileName}`);

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("❌ Deletion Failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};
