const mongoose = require("mongoose");

// ── Connect to MongoDB ─────────────────────────────────────────────────────────
let connected = false;

async function connect() {
  if (connected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    console.log("✅ MongoDB connected — memories will persist forever 🌸");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

// ── Schema ─────────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  user: String,
  bot: String,
  timestamp: { type: Date, default: Date.now },
});

const memorySchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  messages: [messageSchema],
});

const Memory = mongoose.model("Memory", memorySchema);

// ── Get memory for a chat ──────────────────────────────────────────────────────
async function getMemory(chatId) {
  await connect();
  try {
    const doc = await Memory.findOne({ chatId: String(chatId) });
    return doc ? doc.messages : [];
  } catch {
    return [];
  }
}

// ── Save a new exchange ────────────────────────────────────────────────────────
async function saveMemory(chatId, userText, botReply) {
  await connect();
  try {
    const MAX = 50;
    let doc = await Memory.findOne({ chatId: String(chatId) });

    if (!doc) {
      doc = new Memory({ chatId: String(chatId), messages: [] });
    }

    doc.messages.push({ user: userText, bot: botReply });

    // Keep only last 50 messages
    if (doc.messages.length > MAX) {
      doc.messages = doc.messages.slice(-MAX);
    }

    await doc.save();
  } catch (err) {
    console.error("Memory save error:", err.message);
  }
}

// ── Clear memory for a chat ────────────────────────────────────────────────────
async function clearMemory(chatId) {
  await connect();
  try {
    await Memory.deleteOne({ chatId: String(chatId) });
  } catch (err) {
    console.error("Memory clear error:", err.message);
  }
}

module.exports = { getMemory, saveMemory, clearMemory };
