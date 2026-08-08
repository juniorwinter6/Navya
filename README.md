# 🤖 Navya WhatsApp Bot

A powerful, multi-purpose WhatsApp userbot built with Node.js, Baileys, and Gemini AI. Includes built-in group moderation, automatic NSFW detection, and customizable commands.

---

## 🌟 Features

* **AI Chatbot:** Powered by Google's Gemini 2.5 Flash for natural group and private conversations.
* **NSFW Moderation:** Powered by Sightengine API to scan and moderate explicit images in groups.
* **Custom Prefix & Anti-Call:** Prevent unwanted calls and manage admin permissions easily.

---

## ⚙️ Environment Variables Setup

Whether hosting locally or on a cloud panel, you will need the following environment variables:

| Variable | Description | Where to get it |
| :--- | :--- | :--- |
| `SESSION_ID` | Your WhatsApp authentication session string | From your pairing site |
| `GEMINI_API_KEY` | Key for AI response generation | [Google AI Studio](https://aistudio.google.com/) |
| `SIGHTENGINE_USER` | API User ID for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | API Secret Key for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `OWNER_NUMBER` | Bot owner's phone number (with country code) | e.g. `2348058068041` |

---

## 🚀 Installation & Deployment

### Method A: Local / VPS Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/juniorwinter6/Navya-Bot.git](https://github.com/juniorwinter6/Navya-Bot.git)
   cd Navya-Bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in any text editor and fill in your details.

4. **Start the bot:**
   ```bash
   npm start
   ```

---

### Method B: Cloud Panel Deployment (Render / Heroku / Panel)

1. Fork this repository to your GitHub account.
2. Create a new application on your hosting provider and link your forked repository.
3. Open the **Environment Variables** / **Config Vars** section in your provider's dashboard.
4. Add the key-value pairs listed in the table above (e.g., `GEMINI_API_KEY`, `SIGHTENGINE_USER`).
5. Deploy!

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys), [Google Gemini AI](https://aistudio.google.com/), and [Sightengine](https://sightengine.com/).