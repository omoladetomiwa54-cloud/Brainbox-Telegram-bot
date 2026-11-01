const { Telegraf, Markup } = require('telegraf');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) console.log('❌ Add BOT_TOKEN in Render Env');
const bot = new Telegraf(BOT_TOKEN);

// ==== DATABASE (temporary, use MongoDB later) ====
const users = new Map(); // userId -> { balance }
const activeNumbers = new Map(); // phone -> userId

// ==== KEYBOARDS - EXACTLY LIKE YOUR SCREENSHOT ====
const mainKeyboard = Markup.keyboard([
  ['🚀 GET NUMBERS', '💰 WALLET'],
  ['🎉 INVITE & EARN', '❓ HELP']
]).resize().persistent();

function getNumbersKeyboard(numbers) {
  return Markup.keyboard([
    ...numbers.map(n => [`🇳🇬 📋 ${n}`]),
    ['👉 Next'],
    ['👀 Hide country code', '✈️ OTP group']
  ]).resize();
}

// ==== BOT COMMANDS ====
bot.start(async (ctx) => {
  if (!users.has(ctx.from.id)) {
    users.set(ctx.from.id, { balance: 0.17 });
  }
  const bal = users.get(ctx.from.id).balance;
  await ctx.reply(
    `Welcome to BrainBox Number Bot!\n\n` +
    `Balance: $${bal.toFixed(2)}\n` +
    `Click 🚀 GET NUMBERS to get a temporary number`,
    mainKeyboard
  );
});

bot.hears('🚀 GET NUMBERS', async (ctx) => {
  // TODO: Replace with real API call to 5sim / your provider
  const numbers = ['+234 7020424853', '+234 7020425636', '+234 7020422077'];
  
  numbers.forEach(n => activeNumbers.set(n, { userId: ctx.from.id, orderId: Date.now() }));

  await ctx.reply(
    `🇳🇬 Nigeria Smile KM 43 · 💬 All for all\n` +
    `⏱ Expires in 10 minutes\n` +
    `📋 Tap a number to copy it. Codes appear here automatically.\n` +
    `📩 Waiting for SMS...`,
    getNumbersKeyboard(numbers)
  );
});

bot.hears('💰 WALLET', async (ctx) => {
  const u = users.get(ctx.from.id) || { balance: 0 };
  await ctx.reply(`💰 WALLET\n\nTOTAL BALANCE: 💲 ${u.balance.toFixed(2)}`, mainKeyboard);
});

bot.hears('👉 Next', async (ctx) => {
  ctx.reply('Loading more numbers...', mainKeyboard);
  // Call again same logic to fetch next batch
  return bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '🚀 GET NUMBERS' } });
});

// ==== THIS IS THE NEW OTP RECEIVED LOGIC FROM YOUR IMAGE ====
async function handleNewOTP(phoneNumber, otpCode) {
  const data = activeNumbers.get(phoneNumber);
  if (!data) return console.log('Number not active:', phoneNumber);

  const user = users.get(data.userId);
  if (!user) return;

  user.balance += 0.01;
  const orderId = data.orderId || '19513632838';

  // Exact message like your screenshot
  await bot.telegram.sendMessage(
    data.userId,
    `🎉 NEW OTP RECEIVED\n\n` +
    `⭐ ${orderId} | 🇳🇬 NG\n+2347****${phoneNumber.slice(-5)}\n\n` +
    `💲 0.01 added to your balance\n\n` +
    `TOTAL BALANCE: 💲 ${user.balance.toFixed(2)}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`🛡️ 📋 ${otpCode}`, `copy_${otpCode}`)]
    ])
  );
}

// When user clicks the OTP button
bot.action(/copy_(.+)/, async (ctx) => {
  await ctx.answerCbQuery(`Copied: ${ctx.match[1]}`);
});

// ==== WEBHOOK FOR YOUR SMS PROVIDER ====
app.post('/sms-webhook', async (req, res) => {
  const { number, code, otp } = req.body;
  const finalCode = code || otp;
  console.log('📩 SMS RECEIVED:', number, finalCode);
  
  if (number && finalCode) {
    await handleNewOTP(number, finalCode);
  }
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('BrainBox Bot Web Service Running ✅');
});

// ==== START BOTH EXPRESS AND BOT ====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  bot.launch().then(() => console.log('🤖 Telegram Bot Started as WEB SERVICE'));
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
