const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// Fake database for now
const users = new Map();
const activeNumbers = new Map();

// Main Menu
const mainKeyboard = Markup.keyboard([
  ['🚀 GET NUMBERS', '💰 WALLET'],
  ['🎉 INVITE & EARN', '❓ HELP']
]).resize();

bot.start(async (ctx) => {
  if (!users.has(ctx.from.id)) users.set(ctx.from.id, { balance: 0.17 });
  await ctx.reply(`Welcome to BrainBox Number Bot!\nBalance: $${users.get(ctx.from.id).balance}\nTap 🚀 GET NUMBERS`, mainKeyboard);
});

bot.hears('🚀 GET NUMBERS', async (ctx) => {
  const nums = ['+234 7020424853', '+234 7020425636', '+234 7020422077'];
  nums.forEach(n => activeNumbers.set(n, { userId: ctx.from.id }));
  
  await ctx.reply(
    `🇳🇬 Nigeria Smile KM 43\n⏱ Expires in 10 minutes\n📩 Waiting for SMS...`,
    Markup.keyboard([...nums.map(n => [`🇳🇬 📋 ${n}`]), ['👉 Next']]).resize()
  );
});

bot.hears('💰 WALLET', (ctx) => {
  const bal = users.get(ctx.from.id)?.balance || 0;
  ctx.reply(`TOTAL BALANCE: 💲 ${bal.toFixed(2)}`, mainKeyboard);
});

// This will receive SMS from your provider
app.post('/sms-webhook', async (req, res) => {
  const { number, code } = req.body;
  const data = activeNumbers.get(number);
  if (data) {
    const user = users.get(data.userId);
    user.balance += 0.01;
    await bot.telegram.sendMessage(data.userId,
      `🎉 NEW OTP RECEIVED\n\n⭐ 19513632838 | 🇳🇬 NG\n${number}\n\n💲 0.01 added\n\nTOTAL BALANCE: 💲 ${user.balance.toFixed(2)}`,
      Markup.inlineKeyboard([[Markup.button.callback(`🛡️ 📋 ${code}`, 'copy')]])
    );
  }
  res.send('ok');
});

app.get('/', (req, res) => res.send('BrainBox Bot Running ✅'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  bot.launch();
  console.log('Bot started as WEB SERVICE on', PORT);
});
