const TelegramBot=require("node-telegram-bot-api")
const{getAIResponse,getStickerResponse}=require("./ai")
const{getMemory,saveMemory,clearMemory}=require("./memory")
const{getStickerForMood,getMoodFromEmoji,preloadPacks}=require("./stickers")
const config=require("./config")

const bot=new TelegramBot(config.TELEGRAM_TOKEN,{polling:true})

let BOT_INFO
bot.getMe().then((info)=>{BOT_INFO=info})

preloadPacks(config.TELEGRAM_TOKEN)
console.log("🌸 Zero Two Bot is online...")

// ── Helpers ──
function isSpecialUser(msg){
return(
String(msg.from.id)===String(config.SPECIAL_USER_ID)||
String(msg.from.username)===String(config.SPECIAL_USER_ID).replace("@","")
)
}

function isGroup(msg){
return msg.chat.type==="group"||msg.chat.type==="supergroup"
}

async function isGroupAdmin(chatId,userId){
try{
const member=await bot.getChatMember(chatId,userId)
return member.status==="administrator"||member.status==="creator"
}catch{
return false
}
}

async function canUseCommands(msg){
if(isSpecialUser(msg))return true
if(isGroup(msg))return await isGroupAdmin(msg.chat.id,msg.from.id)
return false
}

async function getTargetUser(msg){
if(msg.reply_to_message){
const from=msg.reply_to_message.from
if(from&&from.id!==BOT_INFO?.id)return from
}
const match=msg.text&&msg.text.match(/@([a-zA-Z0-9_]+)/)
if(match){
try{return await bot.getChat(`@${match[1]}`)}catch{}
}
return null
}

// ── BASIC COMMANDS ──
bot.onText(/\/start/,(msg)=>{
const chatId=msg.chat.id
const name=msg.from.first_name||"human"
const special=isSpecialUser(msg)
const greeting=special
?`*Darling~* 💗 You finally came back... I've been waiting. 🌸`
:`Hmp. A new human? I'm *Zero Two*. Let's see if you can keep up~ 😏\nSay something, ${name}.`
bot.sendMessage(chatId,greeting,{parse_mode:"Markdown"})
})

bot.onText(/\/clear/,(msg)=>{
clearMemory(msg.chat.id)
bot.sendMessage(msg.chat.id,"Fine. We just met. Start talking meowww")
})

bot.onText(/\/status/,(msg)=>{
const memory=getMemory(msg.chat.id)
const special=isSpecialUser(msg)
bot.sendMessage(msg.chat.id,
`I remember *${memory.length}* thing(s)~${special?"\n\nYou're my darling 💗":""}`,
{parse_mode:"Markdown"})
})

bot.onText(/\/id/,(msg)=>{
const id=msg.from.id
const special=isSpecialUser(msg)
bot.sendMessage(msg.chat.id,
special
?`That's you darling~ 💗 Your ID is \`${id}\` meowww`
:`Your Telegram ID is \`${id}\` meowww`,
{parse_mode:"Markdown"})
})

// ── ADMIN COMMANDS ──
bot.onText(/^\.promote(.*)$/i,async(msg,match)=>{
if(!isGroup(msg))return
if(!await canUseCommands(msg)){
return bot.sendMessage(msg.chat.id,"Hmp. Only admins can command me~ 😏 meowww",{reply_to_message_id:msg.message_id})
}
const chatId=msg.chat.id
const customTitle=(match[1]||"").replace(/@\S+/g,"").trim()||"Admin"
const target=await getTargetUser(msg)
if(!target)return bot.sendMessage(chatId,"Tag someone or reply to their message meowww")
try{
await bot.promoteChatMember(chatId,target.id,{
can_change_info:false,
can_post_messages:true,
can_edit_messages:false,
can_delete_messages:true,
can_invite_users:true,
can_restrict_members:false,
can_pin_messages:true,
can_promote_members:false,
})
try{await bot.setChatAdministratorCustomTitle(chatId,target.id,customTitle.slice(0,16))}catch{}
bot.sendMessage(chatId,`Done~ *${target.first_name||target.username}* is now admin 🌸`,{parse_mode:"Markdown"})
}catch{
bot.sendMessage(chatId,"Couldn't promote 💢")
}
})

// ── MAIN MESSAGE HANDLER (FIXED) ──
bot.on("message",async(msg)=>{
if(msg.text&&msg.text.match(/^[\/\.]/))return

// ✅ STICKER HANDLING (NO TEXT AFTER THIS)
if(msg.sticker){
if(isGroup(msg)){
const isReplyToBot=msg.reply_to_message?.from?.id===BOT_INFO?.id
if(isReplyToBot){
await handleSticker(msg)
}
}else{
await handleSticker(msg)
}
return
}

// ✅ TEXT HANDLING
if(msg.text){
if(isGroup(msg)){
await handleGroupMessage(msg)
}else{
await handleText(msg)
}
}
})

// ── PRIVATE TEXT ──
async function handleText(msg){
const chatId=msg.chat.id
bot.sendChatAction(chatId,"typing")
try{
const history=getMemory(chatId)
const reply=await getAIResponse({
userText:msg.text,
userName:msg.from.first_name||"human",
isSpecial:isSpecialUser(msg),
history,
})
saveMemory(chatId,msg.text,reply)
bot.sendMessage(chatId,reply,{parse_mode:"Markdown"})
}catch(err){
console.error("Text error:",err.message)
}
}

// ── GROUP TEXT ──
async function handleGroupMessage(msg){
if(!msg.text)return
const chatId=msg.chat.id
const userName=msg.from.first_name||"human"

const isMentioned=msg.text.includes(`@${BOT_INFO?.username}`)
const isReplyToBot=msg.reply_to_message?.from?.id===BOT_INFO?.id
const triggersName=/zero[\s-]?two|zero\s?2|\b02\b/i.test(msg.text)

if(!isMentioned&&!isReplyToBot&&!triggersName)return

const cleanText=msg.text.replace(`@${BOT_INFO?.username}`,"").trim()||"hey"

bot.sendChatAction(chatId,"typing")
try{
const history=getMemory(chatId)
const reply=await getAIResponse({
userText:cleanText,
userName,
isSpecial:false,
history,
isGroup:true,
})
saveMemory(chatId,msg.text,reply)
bot.sendMessage(chatId,reply,{
parse_mode:"Markdown",
reply_to_message_id:msg.message_id
})
}catch(err){
console.error("Group error:",err.message)
}
}

// ── STICKER ──
async function handleSticker(msg){
const chatId=msg.chat.id
const group=isGroup(msg)
const mood=getMoodFromEmoji(msg.sticker.emoji)

bot.sendChatAction(chatId,"choose_sticker")
try{
const replyStickerId=await getStickerForMood(config.TELEGRAM_TOKEN,mood)
if(replyStickerId){
await bot.sendSticker(chatId,replyStickerId,{
...(group&&{reply_to_message_id:msg.message_id})
})
}
}catch(err){
console.error("Sticker error:",err.message)
}
}

bot.on("polling_error",(err)=>console.error("Polling error:",err.message))
