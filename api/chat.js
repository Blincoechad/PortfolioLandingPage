// Vercel serverless function backing the portfolio chat widget.
// Keeps the Gemini API key server-side and grounds every answer in
// ChatBotKnowledge.md so the bot only talks about Chad's real experience.

const fs = require("fs");
const path = require("path");

const KNOWLEDGE_PATH = path.join(process.cwd(), "ChatBotKnowledge.md");
// Tried in order. The flagship "flash" models occasionally return 503s under
// high demand; gemini-3.5-flash-lite has been reliable, so it's the last
// resort rather than the primary pick.
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
const GEMINI_URL_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_MESSAGES = 12; // ~6 back-and-forth turns of prior context
const MAX_OUTPUT_TOKENS = 2048;

// Both places this site is hosted (Vercel + the GitHub Pages mirror), plus
// localhost for testing the widget locally. Same-origin requests never hit
// this list — the browser only sends/enforces Origin on cross-origin calls.
const ALLOWED_ORIGINS = [
  "https://portfolio-landing-page-eight-pink.vercel.app",
  "https://blincoechad.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

let cachedKnowledge = null;
function loadKnowledge() {
  if (cachedKnowledge) return cachedKnowledge;
  cachedKnowledge = fs.readFileSync(KNOWLEDGE_PATH, "utf8");
  return cachedKnowledge;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn) =>
        turn &&
        (turn.role === "user" || turn.role === "model") &&
        typeof turn.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.content.slice(0, MAX_MESSAGE_LENGTH) }],
    }));
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Chat is not configured yet." });
    return;
  }

  const { message, history } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message is required." });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "Message is too long." });
    return;
  }

  const knowledge = loadKnowledge();
  const contents = [
    ...sanitizeHistory(history),
    { role: "user", parts: [{ text: message.trim() }] },
  ];

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: knowledge }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  let lastStatus = null;
  let lastErrText = null;

  try {
    for (const model of GEMINI_MODELS) {
      const geminiRes = await fetch(
        `${GEMINI_URL_BASE}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
      );

      if (!geminiRes.ok) {
        lastStatus = geminiRes.status;
        lastErrText = await geminiRes.text();
        console.error(`Gemini API error (${model}):`, lastStatus, lastErrText);
        // 503 (overloaded) and 429 (rate limited) are worth falling back on;
        // anything else (bad request, auth) will fail the same way on every
        // model, so stop trying instead of burning the whole chain.
        if (lastStatus === 503 || lastStatus === 429) continue;
        break;
      }

      const data = await geminiRes.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!reply) {
        res.status(502).json({
          error:
            "I couldn't put together an answer to that. Try rephrasing, or contact Chad directly.",
        });
        return;
      }

      res.status(200).json({ reply });
      return;
    }

    console.error("All Gemini models failed:", lastStatus, lastErrText);
    res.status(502).json({
      error:
        "Chad's assistant is having trouble right now. Please try again in a moment, or reach out directly through the contact form.",
    });
  } catch (err) {
    console.error("Chat handler error:", err);
    res.status(500).json({
      error: "Something went wrong on my end. Please try again shortly.",
    });
  }
};
