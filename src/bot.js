const TelegramBot = require("node-telegram-bot-api");
const { getAIResponse, getStickerResponse } = require("./ai");
const { getMemory, saveMemory, clearMemory } = require("./memory");
const { getStickerForMood, getMoodFromEmoji, preloadPacks } = require("./stickers");
const config = require("./config");

const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });

preloadPacks(config.TELEGRAM_TOKEN);
console.log("🌸 Zero Two Bot is online...");

// ── Helpers ────────────────────────────────────────────────────────────────────
function isSpecialUser(msg) {
  return (
    String(msg.from.id) === String(config.SPECIAL_USER_ID) ||
    String(msg.from.username) === String(config.SPECIAL_USER_ID).replace("@", "")
  );
}

function isGroup(msg) {
  return msg.chat.type === "group" || msg.chat.type === "supergroup";
}

async function getTargetUser(msg) {
  if (msg.reply_to_message) return msg.reply_to_message.from;
  const match = msg.text && msg.text.match(/@([a-zA-Z0-9_]+)/);
  if (match) {
    try { return await bot.getChat(`@${match[1]}`); } catch {}
  }
  return null;
}

// ── Basic commands ─────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "human";
  const special = isSpecialUser(msg);
  const greeting = special
    ? `*Darling~* 💗 You finally came back... I've been waiting. 🌸`
    : `Hmp. A new human? I'm *Zero Two*. Let's see if you can keep up~ 😏\nSay something, ${name}.`;
  bot.sendMessage(chatId, greeting, { parse_mode: "Markdown" });
});

bot.onText(/\/clear/, (msg) => {
  clearMemory(msg.chat.id);
  bot.sendMessage(msg.chat.id, "Fine. We just met. Start talking meowww");
});

bot.onText(/\/status/, (msg) => {
  const memory = getMemory(msg.chat.id);
  const special = isSpecialUser(msg);
  bot.sendMessage(msg.chat.id,
    `I remember *${memory.length}* thing(s)~${special ? "\n\nYou're my darling 💗" : ""}`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/id/, (msg) => {
  const id = msg.from.id;
  const special = isSpecialUser(msg);
  bot.sendMessage(msg.chat.id,
    special
      ? `That's you darling~ 💗 Your ID is \`${id}\` meowww`
      : `Your Telegram ID is \`${id}\` meowww`,
    { parse_mode: "Markdown" }
  );
});

// ── Admin commands (special user only, groups only) ────────────────────────────

// .promote <title>
bot.onText(/^\.promote(.*)$/i, async (msg, match) => {
  if (!isSpecialUser(msg)) {
    if (isGroup(msg)) bot.sendMessage(msg.chat.id, "Hmp. You don't have the power to command me~ 😏 meowww", { reply_to_message_id: msg.message_id });
    return;
  }
  if (!isGroup(msg)) return;
  const chatId = msg.chat.id;
  const customTitle = (match[1] || "").replace(/@\S+/g, "").trim() || "Admin";
  const target = await getTargetUser(msg);
  if (!target) return bot.sendMessage(chatId, "Tag someone or reply to their message meowww");
  try {
    await bot.promoteChatMember(chatId, target.id, {
      can_change_info: false,
      can_post_messages: true,
      can_edit_messages: false,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: false,
      can_pin_messages: true,
      can_promote_members: false,
    });
    try { await bot.setChatAdministratorCustomTitle(chatId, target.id, customTitle.slice(0, 16)); } catch {}
    bot.sendMessage(chatId, `Done~ *${target.first_name || target.username}* is now admin with title *${customTitle}* 🌸 meowww`, { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, `Couldn't promote 💢 Make sure I'm an admin with promote rights meowww`);
  }
});

// .maxpromote <title>
bot.onText(/^\.maxpromote(.*)$/i, async (msg, match) => {
  if (!isSpecialUser(msg)) {
    if (isGroup(msg)) bot.sendMessage(msg.chat.id, "Hmp. You don't have the power to command me~ 😏 meowww", { reply_to_message_id: msg.message_id });
    return;
  }
  if (!isGroup(msg)) return;
  const chatId = msg.chat.id;
  const customTitle = (match[1] || "").replace(/@\S+/g, "").trim() || "Admin";
  const target = await getTargetUser(msg);
  if (!target) return bot.sendMessage(chatId, "Tag someone or reply to their message meowww");
  try {
    await bot.promoteChatMember(chatId, target.id, {
      can_change_info: true,
      can_post_messages: true,
      can_edit_messages: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_promote_members: true,
      can_manage_chat: true,
      can_manage_video_chats: true,
    });
    try { await bot.setChatAdministratorCustomTitle(chatId, target.id, customTitle.slice(0, 16)); } catch {}
    bot.sendMessage(chatId, `*${target.first_name || target.username}* just got max power 👑 Handle it well meowww`, { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, `Couldn't max-promote 💢 Check my admin permissions meowww`);
  }
});

// .ban
bot.onText(/^\.ban/i, async (msg) => {
  if (!isSpecialUser(msg)) {
    if (isGroup(msg)) bot.sendMessage(msg.chat.id, "Hmp. You don't have the power to command me~ 😏 meowww", { reply_to_message_id: msg.message_id });
    return;
  }
  if (!isGroup(msg)) return;
  const chatId = msg.chat.id;
  const target = await getTargetUser(msg);
  if (!target) return bot.sendMessage(chatId, "Who am I banning? Tag them or reply to their message meowww");
  try {
    await bot.banChatMember(chatId, target.id);
    bot.sendMessage(chatId, `Hmp. *${target.first_name || target.username}* is gone~ Bye bye 🚪 meowww`, { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, `Couldn't ban them 💢 Check my admin permissions meowww`);
  }
});

// .mute
bot.onText(/^\.mute/i, async (msg) => {
  if (!isSpecialUser(msg)) {
    if (isGroup(msg)) bot.sendMessage(msg.chat.id, "Hmp. You don't have the power to command me~ 😏 meowww", { reply_to_message_id: msg.message_id });
    return;
  }
  if (!isGroup(msg)) return;
  const chatId = msg.chat.id;
  const target = await getTargetUser(msg);
  if (!target) return bot.sendMessage(chatId, "Who am I muting? Tag them or reply to their message meowww");
  try {
    await bot.restrictChatMember(chatId, target.id, {
      permissions: {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      }
    });
    bot.sendMessage(chatId, `*${target.first_name || target.username}* is now on silent mode 🤫 meowww`, { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, `Couldn't mute them 💢 Check my admin permissions meowww`);
  }
});

// .unmute
bot.onText(/^\.unmute/i, async (msg) => {
  if (!isSpecialUser(msg)) {
    if (isGroup(msg)) bot.sendMessage(msg.chat.id, "Hmp. You don't have the power to command me~ 😏 meowww", { reply_to_message_id: msg.message_id });
    return;
  }
  if (!isGroup(msg)) return;
  const chatId = msg.chat.id;
  const target = await getTargetUser(msg);
  if (!target) return bot.sendMessage(chatId, "Who am I unmuting? Tag them or reply to their message meowww");
  try {
    await bot.restrictChatMember(chatId, target.id, {
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
      }
    });
    bot.sendMessage(chatId, `Fine~ *${target.first_name || target.username}* can speak again 🌸 meowww`, { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, `Couldn't unmute them 💢 meowww`);
  }
});

// ── All messages ───────────────────────────────────────────────────────────────
bot.on("message", async (msg) => {
  if (msg.text && msg.text.match(/^[\/\.]/)) return;

  if (isGroup(msg)) {
    if (msg.sticker) {
      await handleSticker(msg);
    } else {
      await handleGroupMessage(msg);
    }
  } else {
    if (msg.sticker) {
      await handleSticker(msg);
    } else if (msg.text) {
      await handleText(msg);
    }
  }
});

// ── Private text ───────────────────────────────────────────────────────────────
async function handleText(msg) {
  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, "typing");
  try {
    const history = getMemory(chatId);
    const reply = await getAIResponse({
      userText: msg.text,
      userName: msg.from.first_name || "human",
      isSpecial: isSpecialUser(msg),
      history,
    });
    saveMemory(chatId, msg.text, reply);
    bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Text error:", err.message);
  }
}

// ── Group text ─────────────────────────────────────────────────────────────────
async function handleGroupMessage(msg) {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "human";

  const me = await bot.getMe();
  const isMentioned = msg.text.includes(`@${me.username}`);
  const isReplyToBot = msg.reply_to_message?.from?.username === me.username;
  const triggersName = /zero[\s-]?two|zero\s?2|\b02\b/i.test(msg.text);

  if (!isMentioned && !isReplyToBot && !triggersName) return;

  const cleanText = msg.text.replace(`@${me.username}`, "").trim() || "hey";

  bot.sendChatAction(chatId, "typing"); // ✅ fixed — was missing chatId
  try {
    const history = getMemory(chatId);
    const reply = await getAIResponse({
      userText: cleanText,
      userName,
      isSpecial: false,
      history,
      isGroup: true,
    });
    saveMemory(chatId, msg.text, reply);

    bot.sendMessage(chatId, reply, {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id,
    });
  } catch (err) {
    console.error("Group error:", err.message);
  }
}

// ── Sticker ────────────────────────────────────────────────────────────────────
async function handleSticker(msg) {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "human";
  const group = isGroup(msg);
  const mood = getMoodFromEmoji(msg.sticker.emoji);
  const stickerContext = [
    msg.sticker.emoji ? `emoji ${msg.sticker.emoji}` : "",
    msg.sticker.set_name ? `pack ${msg.sticker.set_name}` : "",
    mood !== "neutral" ? `mood ${mood}` : "",
  ].filter(Boolean).join(", ");

  bot.sendChatAction(chatId, "choose_sticker");
  try {
    const history = getMemory(chatId);
    const [textReply, replyStickerId] = await Promise.all([
      getStickerResponse({ stickerContext, userName, isSpecial: isSpecialUser(msg), history }),
      getStickerForMood(config.TELEGRAM_TOKEN, mood),
    ]);

    const finalText = textReply;

    if (replyStickerId) {
      await bot.sendSticker(chatId, replyStickerId, {
        ...(group && { reply_to_message_id: msg.message_id }),
      });
    }
    await bot.sendMessage(chatId, finalText, {
      parse_mode: "Markdown",
      ...(group && { reply_to_message_id: msg.message_id }),
    });

    saveMemory(chatId, `[sticker: ${stickerContext}]`, textReply);
  } catch (err) {
    console.error("Sticker error:", err.message);
  }
}

bot.on("polling_error", (err) => console.error("Polling error:", err.message));
