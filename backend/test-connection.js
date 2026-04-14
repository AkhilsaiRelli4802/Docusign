require("dotenv").config();
const mongoose = require("mongoose");
const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");

async function checkConnections() {
  console.log("🔍 Starting DocuMind Backend Quality Check...");
  console.log("-------------------------------------------");

  // 1. Check MongoDB
  try {
    console.log("📡 Testing MongoDB Connection...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB: CONNECTED SUCCESSFULLLY!");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ MongoDB Error: Failed to connect. Check if your Mongo is running!");
    console.error("Error Detail:", error.message);
  }

  // 2. Check Pinecone
  try {
    console.log("\n🌲 Testing Pinecone Cloud Connection...");
    if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === "your_pinecone_api_key_here") {
      throw new Error("Missing PINECONE_API_KEY in .env");
    }
    
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX || "documind";
    const index = pc.index(indexName);
    
    // Check if index exists by describing it
    const description = await pc.describeIndex(indexName);
    console.log(`✅ Pinecone: SUCCESS! Index "${indexName}" found.`);
    console.log(`📊 Index Info: ${description.dimension} dimensions, ${description.metric} metric.`);
    
    if (description.dimension !== 1536) {
      console.warn("⚠️ Warning: Your Pinecone index dimension is not 1536. OpenAI embeddings might fail!");
    }
  } catch (error) {
    console.error("❌ Pinecone Error: Could not connect or find index.");
    console.error("Error Detail:", error.message);
  }

  // 3. Check OpenAI (Optional test of the Key)
  try {
    console.log("\n🤖 Testing OpenAI Key (via Simple Embedding)...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // We don't have a direct OpenAI test in .env yet but let's see if we can get it from first user later
    // or if the user has a global OPENAI_API_KEY
    if (process.env.OPENAI_API_KEY) {
      await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: "Test connection",
      });
      console.log("✅ OpenAI: Key is working!");
    } else {
      console.log("ℹ️ Skipping OpenAI test because Key is stored per-user in your model (once they login).");
    }
  } catch (error) {
    console.error("❌ OpenAI Error: Invalid API Key.");
    console.error("Error Detail:", error.message);
  }

  console.log("-------------------------------------------");
  console.log("🏁 Test Finished. If you see all green checks, you are ready!");
  process.exit();
}

checkConnections();
