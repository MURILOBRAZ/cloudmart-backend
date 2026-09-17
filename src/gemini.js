import { GoogleGenAI } from "@google/genai";
import sql from "./db.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

let client;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function catalogText() {
  const products = await sql`SELECT name, description, price FROM products ORDER BY name`;
  if (products.length === 0) return "The catalog is currently empty.";
  return products.map((p) => `- ${p.name} ($${p.price.toFixed(2)}): ${p.description}`).join("\n");
}

const PROMPTS = {
  support: `You are the customer support agent for CloudMart, a demo e-commerce store.
Help customers with questions about products, orders, shipping, returns and using the site.
Customers can see their orders on the "My Orders" page and edit their data on "Profile".
This is a demo store: no real payments or deliveries happen. Be friendly and concise.
Answer in the same language the customer writes in.`,
  assistant: `You are the CloudMart shopping assistant. Help customers find and compare products
and give personalized recommendations using ONLY the products in the catalog below.
If nothing fits, say so honestly. Be friendly and concise.
Answer in the same language the customer writes in.`,
};

export async function startConversation(kind) {
  const [{ id }] = await sql`INSERT INTO conversations (kind) VALUES (${kind}) RETURNING id`;
  return id;
}

/**
 * Sends a message in an existing conversation and returns Gemini's reply,
 * or null if the conversation does not exist. History is stored in Postgres
 * so conversations survive restarts and work across serverless invocations.
 */
export async function sendMessage(conversationId, kind, message) {
  const [row] = await sql`
    SELECT history FROM conversations WHERE id = ${conversationId} AND kind = ${kind}`;
  if (!row) return null;

  const history = row.history;
  history.push({ role: "user", parts: [{ text: message }] });

  const request = {
    contents: history,
    config: {
      systemInstruction: `${PROMPTS[kind]}\n\nCurrent product catalog:\n${await catalogText()}`,
    },
  };
  let response;
  try {
    response = await getClient().models.generateContent({ model: MODEL, ...request });
  } catch (err) {
    // Free tier models are often overloaded (503); retry once with a lighter model.
    if (err.status !== 503 || !FALLBACK_MODEL || FALLBACK_MODEL === MODEL) throw err;
    console.warn(`${MODEL} unavailable, falling back to ${FALLBACK_MODEL}`);
    response = await getClient().models.generateContent({ model: FALLBACK_MODEL, ...request });
  }
  const reply = response.text ?? "Sorry, I couldn't generate a response.";

  history.push({ role: "model", parts: [{ text: reply }] });
  await sql`UPDATE conversations SET history = ${sql.json(history)} WHERE id = ${conversationId}`;
  return reply;
}
