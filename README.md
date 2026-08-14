# 🤖 Navya WhatsApp Bot

**Navya** is a powerful, multi-purpose WhatsApp userbot engineered in Node.js using the Baileys library. Built with performance, modularity, and community hosting in mind, Navya serves as an all-in-one assistant equipped with automated group moderation, real-time media tools, custom command handling, and seamless multi-platform cloud deployment options.

Whether you need strict group protection, automated AI features, or simple utility management, Navya provides a complete hands-off solution with built-in pairing-code authentication for effortless setup across any platform.

---

## 🌟 Features

* **NSFW (antiporn) Moderation:** Powered by the Sightengine API to automatically scan, flag, and delete explicit images sent in groups.
* **AI Integration:** Seamlessly generate text responses using Google Gemini and create images on demand with Hugging Face FLUX models.
* **Anti-Call System:** Automatically declines or blocks unwanted incoming WhatsApp voice/video calls.
* **Group Management:** Built-in moderation tools, customizable command prefixes, and full administrative controls.

---

## ⚙️ Environment Variables Setup

Whether hosting locally or on a cloud panel, configure the following environment variables:

| Variable | Description | Where to get it / Example |
| :--- | :--- | :--- |
| `BOT_NAME` | Display name for the bot | e.g. `Navya` |
| `BOT_NUMBER` | Phone number assigned to the bot (without `+`) | e.g. `2347077445628` |
| `OWNER_NUMBER` | Bot owner's phone number (without `+`) | e.g. `2348058068041` |
| `OWNER_NAME` | Bot owner's display name | e.g. `Rise` |
| `GEMINI_API_KEY` | API Key for Gemini AI responses | [Google AI Studio](https://aistudio.google.com/) |
| `HF_TOKEN` | Hugging Face Access Token for `.imagine` image generation | [Hugging Face Settings](https://huggingface.co/settings/tokens) |
| `SIGHTENGINE_USER` | API User ID for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | API Secret Key for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |

---

## 🚀 Installation & Deployment

### Method A: Local / VPS Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/juniorwinter6/Navya.git
   cd Navya
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create your .env file from the example template and open it in a text editor:

**Windows (PowerShell / Command Prompt):**
```bash
copy .env.example .env
notepad .env
```

**Linux / Mac / VPS:**
```bash
cp .env.example .env
nano .env
```

4. **Start the bot:**
   ```bash
   npm start
   ```

---

### Method B: Cloud & Panel Deployment

#### 1. Render Deployment
No forking required! Click the button below to launch automated setup directly on Render:

[![Deploy to Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?repo=https://github.com/juniorwinter6/Navya)

1. Click the **Deploy to Render** button above.
2. Fill in all required environment variables on the Render setup screen:
   * `BOT_NAME`
   * `OWNER_NAME`
   * `BOT_NUMBER`
   * `OWNER_NUMBER`
   * `PREFIX`
   * `GEMINI_API_KEY`
   * `HF_KEY`
   * `SIGHTENGINE_USER`
   * `SIGHTENGINE_SECRET`
3. Click **Apply** and wait for the build to complete.
4. Once running, check the **Logs** tab on your Render dashboard to retrieve your **8-digit pairing code**!

---

#### 2. Koyeb Deployment
Deploying to Koyeb is fast and automated using our custom Web Form helper!

[![Deploy to Koyeb](https://img.shields.io/badge/Deploy%20to-Koyeb-10B981?style=for-the-badge&logo=koyeb&logoColor=white)](https://jovial-treacle-c8cd59.netlify.app/)

1. Click the **Deploy to Koyeb** button above to open the setup helper.
2. Fill in your bot credentials (`BOT_NAME`, `OWNER_NAME`, `GEMINI_API_KEY`, etc.).
3. Click **🚀 Deploy to Koyeb**—the site will automatically open Koyeb with all your configuration pre-filled.
4. Confirm deployment on Koyeb, then check the **Runtime Logs** tab to grab your **8-digit pairing code**!

#### 3. Katabump / Web Panels
* Upload the repository zip or pull directly from Git inside your panel file manager.
* Rename `.env.example` to `.env` and enter your credentials (`BOT_NAME`, `BOT_NUMBER`, `GEMINI_API_KEY`, `SIGHTENGINE_USER`, etc.).
* Start the service, view the console logs for your pairing code, and link your WhatsApp!

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys), [Google Gemini](https://ai.google.dev/), [Hugging Face](https://huggingface.co/), and [Sightengine](https://sightengine.com/).