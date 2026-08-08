# 🤖 Navya WhatsApp Bot

A powerful, multi-purpose WhatsApp userbot built with Node.js and Baileys. Includes built-in group moderation, automatic NSFW detection, anti-call protection, and customizable commands.

---

## 🌟 Features

* **NSFW Moderation:** Powered by Sightengine API to automatically scan and delete explicit images in groups.
* **Anti-Call System:** Automatically decline or block unwanted incoming WhatsApp calls.
* **Group Management:** Built-in moderation tools, customizable prefixes, and admin controls.

---

## ⚙️ Environment Variables Setup

Whether hosting locally or on a cloud panel, configure the following environment variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `BOT_NAME` | Display name for the bot | `Navya` |
| `BOT_NUMBER` | Phone number assigned to the bot (without `+`) | `2347077445628` |
| `OWNER_NUMBER` | Bot owner's phone number (without `+`) | `2348058068041` |
| `OWNER_NAME` | Bot owner's display name | `Rise` |
| `SIGHTENGINE_USER` | API User ID for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | API Secret Key for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |

---

## 🚀 Installation & Deployment

### Method A: Local / VPS Setup

1. **Clone the repository:**
   git clone https://github.com/juniorwinter6/Navya-Bot.git
   cd Navya-Bot

2. **Install dependencies:**
   npm install

3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and input your details:
   cp .env.example .env
   Open `.env` in any text editor and fill in your variables.

4. **Start the bot:**
   npm start

---

### Method B: Cloud & Panel Deployment (Render / Katabump / Panels)

1. **Render (One-Click Cloud Deployment):**
   * Fork this repository to your GitHub account.
   * Click the button below to start deployment:

     [![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/juniorwinter6/Navya)

   * Fill in your details (`BOT_NUMBER`, `OWNER_NUMBER`, `SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`) on the Render setup screen and click **Apply**.
   * Once deployed, open the **Logs** tab on your Render dashboard to get your **8-digit pairing code** and link your WhatsApp!

2. **Katabump / Web Panels:**
   * Upload the repository zip or pull directly from Git inside your panel.
   * Rename `.env.example` to `.env` in the File Manager and fill in your variables (`BOT_NUMBER`, `OWNER_NUMBER`, etc.).
   * Start the bot, check the console/logs for your pairing code, and link your WhatsApp!

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys) and [Sightengine](https://sightengine.com/).