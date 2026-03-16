# 🌸 Zero Two Telegram Bot

> *"Darling~"* — A Telegram chatbot that roleplays as **Zero Two** from *Darling in the FranXX*, powered by **Sarvam-M** via NVIDIA NIM API.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 Character AI | Fully in-character as Zero Two — playful, bold, caring |
| 💗 Darling Mode | One special Telegram ID gets girlfriend-mode treatment |
| 🧠 Memory | Remembers past conversations (persisted to disk) |
| 🌐 Multilingual | Sarvam-M supports Hindi, Tamil, Telugu, and more |
| ⚡ Fast | Node.js + NVIDIA NIM for low-latency responses |

---

## 🚀 Setup

### 1. Prerequisites
- Node.js v18+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- An NVIDIA NIM API key from [build.nvidia.com](https://build.nvidia.com)

---

### 2. Clone & Install

```bash
git clone <your-repo>
cd zero-two-bot
npm install
```

---

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
TELEGRAM_TOKEN=your_telegram_bot_token
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx
SPECIAL_USER_ID=123456789   # Your Telegram user ID
```

> **How to find your Telegram ID:** Message [@userinfobot](https://t.me/userinfobot) on Telegram — it will reply with your numeric ID.

---

### 4. Run the Bot

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

---

## 💬 Bot Commands

| Command | Description |
|---|---|
| `/start` | Greeting from Zero Two |
| `/clear` | Wipe conversation memory for this chat |
| `/status` | See how many messages Zero Two remembers |

---

## 🗂️ Project Structure

```
zero-two-bot/
├── src/
│   ├── bot.js        # Telegram bot setup & message handling
│   ├── ai.js         # Sarvam-M API calls via NVIDIA NIM
│   ├── memory.js     # Conversation history (read/write JSON)
│   └── config.js     # Env var loader & validator
├── data/
│   └── memory.json   # Auto-created, stores chat histories
├── .env.example      # Template for secrets
├── .gitignore
└── package.json
```

---

## 🧠 How Memory Works

- Every message exchange (user + bot) is saved to `data/memory.json`
- Keyed by Telegram Chat ID
- Last **50 exchanges** are kept per user (older ones are trimmed)
- Use `/clear` to reset memory for a chat
- Memory is injected into every AI prompt so Zero Two feels continuous

---

## 💗 Darling Mode

Set `SPECIAL_USER_ID` in `.env` to one Telegram chat ID. That user gets:
- Zero Two calling them *"darling"* 💗
- Affectionate, girlfriend-mode personality
- Jealousy if other people are mentioned romantically
- A different `/start` greeting

Everyone else gets the **friend mode** — still playful, warm, and in-character, but platonic.

---

## 🌐 Sarvam-M + Indian Languages

Sarvam-M is designed with strong multilingual support for Indian languages. If a user writes in **Hindi, Tamil, Telugu, Kannada, Bengali**, etc., the model will naturally respond in that language while staying in character as Zero Two.

---

## ☁️ Deploying (Optional)

You can run this on any server. Some easy options:

**Railway / Render / Fly.io:**
- Push to GitHub
- Set env variables in the dashboard
- Set start command: `node src/bot.js`

**VPS (Ubuntu):**
```bash
npm install -g pm2
pm2 start src/bot.js --name zero-two-bot
pm2 save
```

---

## ⚠️ Notes

- The bot uses **polling** mode (no webhook needed for local/simple hosting)
- For production with high load, consider switching to webhooks
- Memory is stored locally in `data/memory.json` — back it up if you care about history

---

*"Jian yuan de gu shi"* 🌸
