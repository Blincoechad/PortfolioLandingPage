// Portfolio assistant chat widget. Talks to /api/chat (a Vercel serverless
// function) which grounds answers in ChatBotKnowledge.md. Works unmodified
// on the GitHub Pages mirror too, by pointing cross-origin at the Vercel
// function instead of a relative path.
(function () {
  const CHAT_API_URL = window.location.hostname.endsWith("github.io")
    ? "https://portfolio-landing-page-eight-pink.vercel.app/api/chat"
    : "/api/chat";

  const GREETING =
    "Hi! I'm Chad's portfolio assistant. Ask me about his background, skills, projects, or what he's looking for in a role.";

  const launcher = document.getElementById("chatbotLauncher");
  const panel = document.getElementById("chatbotPanel");
  const closeBtn = document.getElementById("chatbotClose");
  const messagesEl = document.getElementById("chatbotMessages");
  const suggestionsEl = document.getElementById("chatbotSuggestions");
  const form = document.getElementById("chatbotForm");
  const input = document.getElementById("chatbotInput");
  const sendBtn = document.getElementById("chatbotSend");

  if (!launcher || !panel || !form || !input) return;

  let history = [];
  let hasGreeted = false;
  let isSending = false;

  function appendMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "chatbot-message chatbot-message--user"
        : "chatbot-message chatbot-message--bot";
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function showTyping() {
    const bubble = document.createElement("div");
    bubble.className = "chatbot-message chatbot-message--bot chatbot-message--typing";
    bubble.setAttribute("aria-label", "Assistant is typing");
    bubble.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function setSending(state) {
    isSending = state;
    input.disabled = state;
    sendBtn.disabled = state;
  }

  async function sendMessage(text) {
    if (isSending || !text.trim()) return;

    if (suggestionsEl) suggestionsEl.hidden = true;
    appendMessage("user", text.trim());
    history.push({ role: "user", content: text.trim() });
    setSending(true);

    const typingBubble = showTyping();

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: history.slice(0, -1),
        }),
      });

      const data = await res.json().catch(() => ({}));
      typingBubble.remove();

      if (!res.ok || !data.reply) {
        appendMessage(
          "bot",
          data.error ||
            "Something went wrong. Please try again, or use the contact form below.",
        );
        return;
      }

      appendMessage("bot", data.reply);
      history.push({ role: "model", content: data.reply });
    } catch (err) {
      typingBubble.remove();
      appendMessage(
        "bot",
        "I couldn't reach the server. Check your connection and try again, or use the contact form below.",
      );
    } finally {
      setSending(false);
      input.focus();
    }
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    launcher.classList.add("is-active");
    if (!hasGreeted) {
      appendMessage("bot", GREETING);
      hasGreeted = true;
    }
    window.requestAnimationFrame(() => input.focus());
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.classList.remove("is-active");
    launcher.focus();
  }

  function togglePanel() {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  }

  launcher.addEventListener("click", togglePanel);
  closeBtn?.addEventListener("click", closePanel);

  document.querySelectorAll("[data-close-chatbot-link]").forEach((link) => {
    link.addEventListener("click", closePanel);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      closePanel();
    }
  });

  if (suggestionsEl) {
    suggestionsEl.querySelectorAll("[data-chat-suggestion]").forEach((chip) => {
      chip.addEventListener("click", () => {
        sendMessage(chip.textContent.trim());
      });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value;
    input.value = "";
    sendMessage(text);
  });
})();
