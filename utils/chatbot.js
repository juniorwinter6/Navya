const memory = new Map()

function getMemory(user) {
    if (!memory.has(user)) {
        memory.set(user, [])
    }
    return memory.get(user)
}

function saveMemory(user, text) {
    const mem = getMemory(user)

    mem.push(text)

    // keep only last 10 messages
    if (mem.length > 10) mem.shift()
}

function simpleReply(text) {

    const msg = text.toLowerCase()

    if (msg.includes("hello") || msg.includes("hi")) {
        return "Hello 👋"
    }

    if (msg.includes("how are you")) {
        return "I'm fine 🙂 how about you?"
    }

    if (msg.includes("your name")) {
        return "I'm NavyaBot 🤖"
    }

    if (msg.includes("bye")) {
        return "Goodbye 👋"
    }

    return null
}

async function getAIReply(user, text) {

    // save memory
    saveMemory(user, text)

    // try smart local replies first
    const local = simpleReply(text)
    if (local) return local

    // fallback response (safe AI-like behavior)
    return "I understand you 🤖 tell me more."
}

module.exports = {
    getAIReply
}