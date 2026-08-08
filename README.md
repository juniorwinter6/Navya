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

| Variable | Description | Where to get it |
| :--- | :--- | :--- |
| `SESSION_ID` | Your WhatsApp authentication session string | From your pairing site |
| `BOT_NUMBER` | Phone number assigned to the bot (without `+`) | e.g. `2347077445628` |
| `SIGHTENGINE_USER` | API User ID for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | API Secret Key for Anti-Porn scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `OWNER_NUMBER` | Bot owner's phone number | e.g. `2348058068041` |
| `OWNER_NAME` | Bot owner's display name | e.g. `Rise` |

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
   Copy the example environment file and add your credentials:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in any text editor and fill in your details.

4. **Start the bot:**
   ```bash
   npm start
   ```

---

### Method B: Cloud Deployment (Koyeb / Render / Katabump / Panels)

1. **Koyeb & Render:**
   * Fork this repository to your GitHub account.
   * Create a new Web Service on Koyeb or Render and link your forked repository.
   * Go to **Environment Variables** in the dashboard and add `SESSION_ID`, `BOT_NUMBER`, `SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`, and `OWNER_NUMBER`.
   * Set start command to `npm start` and deploy!

2. **Katabump & Pterodactyl Panels:**
   * Upload your files or import the repository inside your panel console.
   * Navigate to the **Startup / Environment** tab and input your environment variables into the fields.
   * Go to the Console, run `npm install`, and start the instance.

---

## 🛡️ License & Credits

* Developed by **Rise** ([@juniorwinter6](https://github.com/juniorwinter6))
* Powered by [Baileys](https://github.com/WhiskeySockets/Baileys) and [Sightengine](https://sightengine.com/).