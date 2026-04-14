const { queryRAG } = require("../services/rag.service");
const { getClient } = require("../services/openai.service");
const { decrypt } = require("../utils/encrypt");

exports.chat = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const { _id: userId, openaiKey } = req.user;
    if (!openaiKey) {
      return res.status(403).json({ message: "Please store your OpenAI API key first" });
    }

    const client = getClient(decrypt(openaiKey));

    // 1. RAG Retrieve & Similarity Check
    const { relevantContext, similarity } = await queryRAG(client, userId, question);

    // 2. Decide Prompt Strategy
    let messages = [];
    let usedRAG = false;

    if (relevantContext) {
      usedRAG = true;
      messages = [
        {
          role: "system",
          content: `You are a helpful assistant. Use the following context from the user's uploaded documents to answer the question. If the answer is not in the context, say so, but you can still provide a general answer if appropriate based on internal knowledge.
          
          Context:
          ${relevantContext}`,
        },
        { role: "user", content: question },
      ];
    } else {
      messages = [{ role: "user", content: question }];
    }

    // 3. Generate Answer
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
    });

    res.status(200).json({
      answer: response.choices[0].message.content,
      usedRAG,
      similarityScore: similarity,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};
