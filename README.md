# 🤖 Navya WhatsApp Bot

**Navya** is a powerful, multi-purpose WhatsApp userbot engineered in Node.js using the Baileys library. Built with performance, modularity, and community hosting in mind, Navya serves as an all-in-one assistant equipped with automated group moderation, real-time media tools, custom command handling, and seamless multi-platform cloud deployment options.

Whether you need strict group protection, automated AI features, or simple utility management, Navya provides a complete hands-off solution using cloud-based session authentication for effortless deployment.

---

## 🌟 Features

* **NSFW (antiporn) Moderation:** Powered by the Sightengine API to automatically scan, flag, and delete explicit images sent in groups.
* **AI Integration:** Seamlessly generate text responses using Google Gemini and create images on demand with Hugging Face FLUX models.
* **Anti-Call System:** Automatically declines or blocks unwanted incoming WhatsApp voice/video calls.
* **Group Management:** Built-in moderation tools, customizable command prefixes, and full administrative controls.
* **Web Session Authenticator:** Link your WhatsApp account seamlessly via our online pairing portal to generate your `SESSION_ID`.

---

## 🔑 Step 1: Get Your Session ID

Before deploying the bot locally or to any cloud platform, you must generate a `SESSION_ID`:

1. Visit the **[Navya Pair Site](https://navya-pair.onrender.com)**.
2. Enter your WhatsApp phone number in international format without `+` or spaces (e.g., `2348012345678`).
3. Click **Get Code** and copy the 8-digit pairing code shown on screen.
4. Open WhatsApp on your phone -> **Linked Devices** -> **Link with Phone Number**, and enter the code.
5. Check your WhatsApp DMs—Navya Pair Site will send you a message containing your `SESSION_ID` string (starts with `NAVYA~...`).
6. Copy this code and use it in your environment variables setup below.

---

## ⚙️ Environment Variables Setup

Configure the following environment variables when hosting locally or on cloud providers:

| Variable | Description | Where to get it / Example |
| :--- | :--- | :--- |
| `SESSION_ID` | **Required.** Session authentication string | [Navya Pair Site](https://navya-pair.onrender.com) |
| `BOT_NAME` | Display name for the bot | e.g. `Navya` |
| `BOT_NUMBER` | Phone number assigned to the bot (without `+`) | e.g. `2347077445628` |
| `OWNER_NUMBER` | Bot owner's phone number (without `+`) | e.g. `2348058068041` |
| `OWNER_NAME` | Bot owner's display name | e.g. `Rise` |
| `PREFIX` | Command prefix symbol | e.g. `.` |
| `GEMINI_API_KEY` | API Key for Gemini AI responses | [Google AI Studio](https://ai.google.dev/) |
| `HF_TOKEN` | Hugging Face Access Token for `.imagine` | [Hugging Face Settings](https://huggingface.co/settings/tokens) |
| `SIGHTENGINE_USER` | API User ID for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | API Secret Key for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |

---

## 🚀 Installation & Deployment

### Method A: Local / VPS Setup

1. **Get your Session ID:**
   Generate your `SESSION_ID` from the **[Navya Pair Site](https://navya-pair.onrender.com)**.

2. **Clone the repository:**
   ``` bash
   git clone https://github.com/juniorwinter6/Navya.git
   cd Navya
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Environment Variables:**
   Create your `.env` file from the example template and open it in a text editor:

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

   Paste your `SESSION_ID` and other credentials into the `.env` file.

5. **Start the bot:**
   ```bash
   npm start
   ```

---

### Method B: Cloud & Panel Deployment

#### 1. Render Deployment
No forking required! Click the button below to launch automated setup directly on Render:

[![Deploy to Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?repo=https://github.com/juniorwinter6/Navya)

1. Get your `SESSION_ID` from **[Navya Pair Site](https://navya-pair.onrender.com)**.
2. Click the **Deploy to Render** button above.
3. Fill in all required environment variables on the Render setup screen:
   * `SESSION_ID` *(Paste your NAVYA~... code here)*
   * `BOT_NAME`
   * `OWNER_NAME`
   * `BOT_NUMBER`
   * `OWNER_NUMBER`
   * `PREFIX`
   * `GEMINI_API_KEY`
   * `HF_TOKEN`
   * `SIGHTENGINE_USER`
   * `SIGHTENGINE_SECRET`
4. Click **Apply** and wait for the build to complete. Your bot will connect automatically!

---

#### 2. Koyeb Deployment
Deploying to Koyeb is fast and automated using our custom Web Form helper!

[![Deploy to Koyeb](https://img.shields.io/badge/Deploy%20to-Koyeb-10B981?style=for-the-badge&logo=koyeb&logoColor=white)](https://jovial-treacle-c8cd59.netlify.app/)

1. Get your `SESSION_ID` from **[Navya Pair Site](https://navya-pair.onrender.com)**.
2. Click the **Deploy to Koyeb** button above to open the setup helper.
3. Fill in your `SESSION_ID` and bot credentials (`BOT_NAME`, `OWNER_NAME`, `GEMINI_API_KEY`, etc.).
4. Click **🚀 Deploy to Koyeb**—the site will automatically open Koyeb with all your configuration pre-filled.
5. Confirm deployment on Koyeb, and the bot will start up immediately!

---

#### 3. Katabump / Web Panels
* Obtain your `SESSION_ID` from **[Navya Pair Site](https://navya-pair.onrender.com)**.
* Upload the repository zip or pull directly from Git inside your panel file manager.
* Rename `.env.example` to `.env` and enter your credentials including your `SESSION_ID`.
* Start the service and your bot will come online instantly.

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys), [Google Gemini](https://ai.google.dev/), [Hugging Face](https://huggingface.co/), and [Sightengine](https://sightengine.com/).

