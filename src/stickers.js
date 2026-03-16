const https = require("https");

// Real sticker packs provided by the user
// Pack names extracted from t.me/addstickers/<name>
const ALL_PACKS = [
  "Snowww41",
  "Zero_two_Hanim1O_by_fStikBot",
  "Meikai8",
  "t_me_addstickerieiieieieieieiieieieirididicigir_by_fStikBot",
  "GpvtfSG_by_sticbot",
  "Hiroxzerotwo02",
];

// Cache fetched sticker sets
const stickerCache = {};

// Fetch all stickers from a Telegram sticker set
function fetchStickerSet(botToken, setName) {
  return new Promise((resolve) => {
    if (stickerCache[setName]) return resolve(stickerCache[setName]);

    const url = `https://api.telegram.org/bot${botToken}/getStickerSet?name=${setName}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok && parsed.result?.stickers?.length) {
            stickerCache[setName] = parsed.result.stickers;
            resolve(parsed.result.stickers);
          } else {
            console.log(`Pack not found or empty: ${setName}`);
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
  });
}

// Pre-load all packs into cache at startup
async function preloadPacks(botToken) {
  console.log("🌸 Preloading sticker packs...");
  for (const pack of ALL_PACKS) {
    const stickers = await fetchStickerSet(botToken, pack);
    if (stickers) {
      console.log(`  ✅ ${pack} — ${stickers.length} stickers loaded`);
    } else {
      console.log(`  ❌ ${pack} — failed to load`);
    }
  }
  console.log("🌸 Sticker packs ready!");
}

// Get a random sticker from any of the loaded packs
// Optionally biased by mood using sticker emoji matching
async function getStickerForMood(botToken, mood) {
  // Emojis associated with each mood — used to find matching stickers in packs
  const moodEmojis = {
    laughing:    ["😂", "🤣", "😹", "😆"],
    sad:         ["😭", "😢", "🥺", "😿"],
    love:        ["😍", "🥰", "❤️", "💕", "💗"],
    angry:       ["😡", "💢", "😤", "🔥"],
    bored:       ["😴", "💤", "😑"],
    happy:       ["😊", "😄", "🙂", "✨"],
    thinking:    ["🤔", "🧐", "💭"],
    smug:        ["😏", "😈", "😼"],
    wave:        ["👋", "🤗"],
    hug:         ["🤗", "💕", "🫂"],
    unimpressed: ["🙄", "😑", "💀"],
    dead:        ["💀", "😵"],
    silly:       ["🤡", "😜", "😝"],
    hype:        ["🔥", "✨", "🎉"],
    surprised:   ["😳", "😮", "😲"],
    awkward:     ["😅", "😬"],
    shy:         ["🤭", "😳", "🫣"],
    neutral:     [],
  };

  const targetEmojis = moodEmojis[mood] || [];

  // Collect all stickers from all loaded packs
  let allStickers = [];
  for (const pack of ALL_PACKS) {
    const stickers = await fetchStickerSet(botToken, pack);
    if (stickers) allStickers = allStickers.concat(stickers);
  }

  if (!allStickers.length) return null;

  // Try to find a sticker whose emoji matches the mood
  if (targetEmojis.length > 0) {
    const moodMatches = allStickers.filter(s => targetEmojis.includes(s.emoji));
    if (moodMatches.length > 0) {
      return moodMatches[Math.floor(Math.random() * moodMatches.length)].file_id;
    }
  }

  // Fallback: pick any random sticker from any pack
  return allStickers[Math.floor(Math.random() * allStickers.length)].file_id;
}

// Map incoming sticker emoji to mood bucket
const EMOJI_TO_MOOD = {
  "😂": "laughing", "🤣": "laughing", "😹": "laughing",
  "😭": "sad",      "😢": "sad",      "🥺": "sad",
  "😍": "love",     "🥰": "love",     "❤️": "love",   "💕": "love",
  "😡": "angry",    "💢": "angry",    "😤": "angry",
  "😴": "bored",    "💤": "bored",
  "😊": "happy",    "😄": "happy",    "🙂": "happy",
  "🤔": "thinking", "🧐": "thinking",
  "😏": "smug",     "😈": "smug",
  "👋": "wave",     "🤗": "hug",
  "🙄": "unimpressed", "😑": "unimpressed",
  "💀": "dead",     "🤡": "silly",
  "🔥": "hype",     "✨": "hype",
  "😳": "surprised","😮": "surprised",
  "😅": "awkward",  "🤭": "shy",
};

function getMoodFromEmoji(emoji) {
  return EMOJI_TO_MOOD[emoji] || "neutral";
}

module.exports = { getStickerForMood, getMoodFromEmoji, preloadPacks };
