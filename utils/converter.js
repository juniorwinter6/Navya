const fs = require("fs")
const path = require("path")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")

ffmpeg.setFfmpegPath(ffmpegPath)

const tempDir = path.join(__dirname, "../temp")

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}

// Keep this for your regular .song command
async function toAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        const input = path.join(tempDir, `${Date.now()}.${ext}`)
        const output = path.join(tempDir, `${Date.now()}.mp3`)

        fs.writeFileSync(input, buffer)

        ffmpeg(input)
            .toFormat("mp3")
            .noVideo()
            .audioChannels(2)
            .audioBitrate('128k')
            .on("error", reject)
            .on("end", () => {
                try {
                    const data = fs.readFileSync(output)
                    if (fs.existsSync(input)) fs.unlinkSync(input)
                    if (fs.existsSync(output)) fs.unlinkSync(output)
                    resolve(data)
                } catch (err) {
                    reject(err)
                }
            })
            .save(output)
    })
}

// Use this for your .sing command to get the navya1.PNG look
async function toPTT(buffer, ext) {
    return new Promise((resolve, reject) => {
        const input = path.join(tempDir, `${Date.now()}_in.${ext}`)
        const output = path.join(tempDir, `${Date.now()}_out.opus`)

        fs.writeFileSync(input, buffer)

        ffmpeg(input)
            .noVideo()
            .audioChannels(1)         // REQUIRED: Must be mono for the waveform to generate
            .audioBitrate('24k')      // Optimized lightweight bitrate for WhatsApp mobile streams
            .outputOptions([
                '-c:a libopus',       // Forces strict native WhatsApp Opus audio codec compression
                '-vbr on',            // Enables Variable Bit Rate for smoother processing
                '-f ogg'              // Hard-binds the output streaming container structure to OGG
            ])
            .on("error", (err) => {
                console.error("FFmpeg Trancoding Error Details:", err);
                reject(err);
            })
            .on("end", () => {
                try {
                    const data = fs.readFileSync(output)
                    if (fs.existsSync(input)) fs.unlinkSync(input)
                    if (fs.existsSync(output)) fs.unlinkSync(output)
                    resolve(data)
                } catch (err) {
                    reject(err)
                }
            })
            .save(output)
    })
}

module.exports = {
    toAudio,
    toPTT
}