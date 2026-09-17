import { Router } from "express";
import { sendMessage, startConversation } from "../gemini.js";

const router = Router();

async function handleMessage(res, conversationId, kind, message) {
  if (!conversationId || !message?.trim()) {
    return res.status(400).json({ error: "conversation id and message are required" });
  }
  const reply = await sendMessage(conversationId, kind, message);
  if (reply === null) return res.status(404).json({ error: "Conversation not found" });
  res.json({ response: reply });
}

// Customer support page (SupportPage)
router.post("/start", async (req, res) => {
  res.json({ threadId: await startConversation("support") });
});

router.post("/message", (req, res) =>
  handleMessage(res, req.body.threadId, "support", req.body.message)
);

// Floating shopping assistant (AIAssistant). The "bedrock" path is kept so the
// frontend works unchanged, but it is served by Gemini.
router.post("/bedrock/start", async (req, res) => {
  res.json({ conversationId: await startConversation("assistant") });
});

router.post("/bedrock/message", (req, res) =>
  handleMessage(res, req.body.conversationId, "assistant", req.body.message)
);

export default router;
