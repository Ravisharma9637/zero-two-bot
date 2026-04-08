function random(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

// ⏳ Typing delay
async function typingDelay(text){
let delay=text.length<50?random(800,1800):random(1800,3500)
if(Math.random()<0.12)delay+=random(1500,3000) // late reply sometimes
await sleep(delay)
}

// ❗ Imperfection layer
function imperfection(text){
if(Math.random()<0.2)return text.replace(/\.$/,"")+"..."
if(Math.random()<0.1)return "Wait— "+text
return text
}

// 😏 Tone variation (safe for your character)
function tone(text){
if(Math.random()<0.18)return text.replace("meowww","... meowww")
if(Math.random()<0.12)return text.replace("meowww"," 😏 meowww")
return text
}

// 💬 Split message like real texting
function split(text){
if(Math.random()<0.25&&text.length>30){
let mid=Math.floor(text.length/2)
let idx=text.indexOf(" ",mid)
if(idx!==-1)return[text.slice(0,idx),text.slice(idx+1)]
}
return[text]
}

// 🔥 Rare follow-up
function followUp(){
const f=[
"Hmm... go on meowww",
"You’re hiding something 😏 meowww",
"That’s not everything, is it? meowww",
"Say more meowww"
]
return Math.random()<0.15?f[random(0,f.length-1)]:null
}

// 🧠 Reply enhancer (important)
function enhanceReply(text){
if(!text)return text

// remove overly formal starts
text=text.replace(/^(Well,|Okay,|Alright,)/i,"")

// make it slightly more casual
text=text.replace(/I am/g,"I'm")
text=text.replace(/do not/g,"don't")

return text.trim()
}

module.exports={
typingDelay,
imperfection,
tone,
split,
followUp,
enhanceReply
}
