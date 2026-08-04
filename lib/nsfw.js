const axios = require("axios")
const FormData = require("form-data")

async function isNSFW(buffer, type = "image") {
    try {

        const form = new FormData()

        form.append("media", buffer, {
            filename: type === "video" ? "video.jpg" : "image.jpg"
        })

        const res = await axios.post(
            "https://api.sightengine.com/1.0/check.json",
            form,
            {
                params: {
                    models: "nudity",
                    api_user: process.env.SIGHTENGINE_USER,
                    api_secret: process.env.SIGHTENGINE_SECRET
                },
                headers: form.getHeaders()
            }
        )

        const nudity =
            res.data?.nudity?.raw ||
            res.data?.nudity?.sexual_activity ||
            0

        return nudity > 0.6

    } catch (err) {
        console.log("NSFW API ERROR:", err.response?.data || err.message)
        return false
    }
}

module.exports = { isNSFW }