require("dotenv").config();

const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

async function telegram(method, data = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return response.json();
}

async function sendMessage(chatId, text, keyboard) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: keyboard
  });
}

const menu = {
  keyboard: [
    ["🚀 GET STARTED", "💰 WALLET"],
    ["👤 PROFILE", "❓ HELP"]
  ],
  resize_keyboard: true
};

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/start") {
    return sendMessage(
      chatId,
      "Welcome to BRAINBOX BOT!\n\nChoose an option below.",
      menu
    );
  }

  if (text === "🚀 GET STARTED") {
    return sendMessage(
      chatId,
      "Welcome! This is the BRAINBOX service menu.",
      {
        keyboard: [["💰 WALLET", "👤 PROFILE"], ["❓ HELP"]],
        resize_keyboard: true
      }
    );
  }

  if (text === "💰 WALLET") {
    return sendMessage(chatId, "Your wallet balance: $0.00", menu);
  }

  if (text === "👤 PROFILE") {
    return sendMessage(
      chatId,
      `Your Telegram ID: ${chatId}`,
      menu
    );
  }

  if (text === "❓ HELP") {
    return sendMessage(
      chatId,
      "Welcome to BRAINBOX support. Please contact the administrator for assistance.",
      menu
    );
  }

  return sendMessage(chatId, "Please choose an option from the menu.", menu);
}

async function startBot() {
  if (!TOKEN) {
    throw new Error("BOT_TOKEN is missing.");
  }

  console.log("BRAINBOX Telegram bot is starting...");

  let offset = 0;

  while (true) {
    try {
      const result = await telegram("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"]
      });

      if (!result.ok) {
        throw new Error(result.description || "Telegram API error");
      }

      for (const update of result.result) {
        offset = update.update_id + 1;

        if (update.message) {
          await handleMessage(update.message);
        }
      }
    } catch (error) {
      console.error("Bot error:", error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

startBot();
