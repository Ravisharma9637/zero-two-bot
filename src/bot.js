const express=require("express")
const app=express()
const TelegramBot=require("node-telegram-bot-api")
const{getAIResponse,getStickerResponse}=require("./ai")
const{getMemory,saveMemory,clearMemory}=require("./memory")
const{getStickerForMood,getMoodFromEmoji,preloadPacks}=require("./stickers")
const config=require("./config")

const bot=new TelegramBot(config.TELEGRAM_TOKEN,{polling:true})

let BOT_INFO

bot.getMe().then((info)=>{
BOT_INFO=info
})

preloadPacks(config.TELEGRAM_TOKEN)
console.log("🌸 Zero Two Bot is online...")

function isSpecialUser(msg){
return(
String(msg.from.id)===String(config.SPECIAL_USER_ID)||
String(msg.from.username)===String(config.SPECIAL_USER_ID).replace("@","")
)
}

function isGroup(msg){
return msg.chat.type==="group"||msg.chat.type==="supergroup"
}

async function getTargetUser(msg){
if(msg.reply_to_message)return msg.reply_to_message.from
const match=msg.text&&msg.text.match(/@([a-zA-Z0-9_]+)/)
if(match){
try{return await bot.getChat(`@${match[1]}`)}catch{}
}
return null
}

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

bot.on("message",async(msg)=>{
if(msg.text&&msg.text.match(/^[\/\.]/))return

if(isGroup(msg)){
const isReplyToBot=msg.reply_to_message?.from?.id===BOT_INFO.id

if(msg.sticker&&isReplyToBot){
await handleSticker(msg)
}else if(msg.text){
await handleGroupMessage(msg)
}

}else{
if(msg.sticker){
await handleSticker(msg)
}else if(msg.text){
await handleText(msg)
}
}
})

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

async function handleGroupMessage(msg){
if(!msg.text)return
const chatId=msg.chat.id
const userName=msg.from.first_name||"human"

const isMentioned=msg.text.includes(`@${BOT_INFO.username}`)
const isReplyToBot=msg.reply_to_message?.from?.id===BOT_INFO.id
const triggersName=/zero[\s-]?two|zero\s?2|\b02\b/i.test(msg.text)

if(!isMentioned&&!isReplyToBot&&!triggersName)return

const cleanText=msg.text.replace(`@${BOT_INFO.username}`,"").trim()||"hey"

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

async function handleSticker(msg){
const chatId=msg.chat.id
const userName=msg.from.first_name||"human"
const group=isGroup(msg)
const mood=getMoodFromEmoji(msg.sticker.emoji)

const stickerContext=[
msg.sticker.emoji?`emoji ${msg.sticker.emoji}`:"",
msg.sticker.set_name?`pack ${msg.sticker.set_name}`:"",
mood!=="neutral"?`mood ${mood}`:""
].filter(Boolean).join(", ")

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

app.get("/",(req,res)=>{
res.send("Bot is running")
})

const PORT=process.env.PORT||3000

setInterval(()=>{
fetch("https://zero-two-bot-tfbv.onrender.com")
.then(()=>console.log("Self ping successful"))
.catch(()=>console.log("Self ping failed"))
},300000)

app.listen(PORT,()=>{
console.log("Server running on port "+PORT)
})
