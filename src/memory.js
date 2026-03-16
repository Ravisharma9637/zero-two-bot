const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(__dirname, "../data/memory.json");
const MAX_HISTORY_PER_USER = 50; // keep last 50 exchanges per user

// Ensure data directory exists
function ensureDir() {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Load all memory from disk
function loadAll() {
  ensureDir();
  if (!fs.existsSync(MEMORY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

// Save all memory to disk
function saveAll(data) {
  ensureDir();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

// Get memory for a specific chat
function getMemory(chatId) {
  const all = loadAll();
  return all[String(chatId)] || [];
}

// Save a new exchange to memory
function saveMemory(chatId, userText, botReply) {
  const all = loadAll();
  const key = String(chatId);
  if (!all[key]) all[key] = [];

  all[key].push({
    user: userText,
    bot: botReply,
    timestamp: new Date().toISOString(),
  });

  // Trim to max history
  if (all[key].length > MAX_HISTORY_PER_USER) {
    all[key] = all[key].slice(-MAX_HISTORY_PER_USER);
  }

  saveAll(all);
}

// Clear memory for a chat
function clearMemory(chatId) {
  const all = loadAll();
  delete all[String(chatId)];
  saveAll(all);
}

module.exports = { getMemory, saveMemory, clearMemory };
