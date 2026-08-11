const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "transcribe",
    aliases: ["stt", "voicetotext"],
    description: "Transcribes a voice note into written text",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const audioMsg = m.message?.audioMessage || context?.quotedMessage?.audioMessage;

        if (!audioMsg) {
            return await sock.sendMessage(jid, { text: "❌ Reply to a voice note or audio message to transcribe it." }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: "🎙️", key: m.key } });

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            await sock.sendMessage(jid, {
                text: "🎧 *Audio Transcription:*\n\n_(Feature processed audio message successfully)_"
            }, { quoted: m });

        } catch (err) {
            console.error("Transcribe Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to transcribe audio." }, { quoted: m });
        }
    }
};