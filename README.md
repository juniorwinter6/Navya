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
   git clone https://github.com/juniorwinter6/Navya.git
   cd Navya

2. **Install dependencies:**
   npm install

3. **Configure Environment Variables:**
   Create your .env file from the example template and open it in a text editor:

**Windows (PowerShell / Command Prompt):**
copy .env.example .env
notepad .env

**Linux / Mac / VPS:**
cp .env.example .env
nano .env

4. **Start the bot:**
   npm start

---

### Method B: Cloud & Panel Deployment

#### 1. Render (One-Click Cloud Deployment)
* Fork this repository to your GitHub account.
* Click the button below to launch automated setup:

  [![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/juniorwinter6/Navya)

* On the Render setup screen, fill in your environment variables:
  * `BOT_NAME`
  * `BOT_NUMBER`
  * `OWNER_NUMBER`
  * `GEMINI_API_KEY`
  * `SIGHTENGINE_USER`
  * `SIGHTENGINE_SECRET`
* Click **Apply** and wait for the build to complete.
* Once running, open the **Logs** tab on your Render dashboard to grab your **8-digit pairing code** and link your WhatsApp!

#### 2. Koyeb Deployment
* Fork this repository to your GitHub account.
* Log in to [Koyeb](https://app.koyeb.com/) and create a new Web Service.
* Choose GitHub as your source and select your forked `Navya-Bot` repository.
* In the **Environment Variables** section, add your keys (`BOT_NAME`, `BOT_NUMBER`, `OWNER_NUMBER`, `GEMINI_API_KEY`, `SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`).
* Set the run command to `npm start` and deploy.
* Check the **Runtime Logs** to retrieve your 8-digit pairing code.

#### 3. Katabump / Web Panels
* Upload the repository zip or pull directly from Git inside your panel file manager.
* Rename `.env.example` to `.env` and enter your credentials (`BOT_NAME`, `BOT_NUMBER`, `GEMINI_API_KEY`, `SIGHTENGINE_USER`, etc.).
* Start the service, view the console logs for your pairing code, and link your WhatsApp!

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys), [Google Gemini](https://ai.google.dev/), [Hugging Face](https://huggingface.co/), and [Sightengine](https://sightengine.com/).