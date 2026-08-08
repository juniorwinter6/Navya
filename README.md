# 🤖 Navya WhatsApp Bot

A powerful, multi-purpose WhatsApp userbot built with Node.js and Baileys. Features automated NSFW image detection, group moderation tools, anti-call protection, and custom administrative controls.

---

## 🌟 Features

* **🛡️ NSFW & Anti-Porn Moderation:** Automatically scans group images using Sightengine API and removes explicit content.
* **📞 Anti-Call System:** Automatically declines or blocks incoming WhatsApp calls to keep the bot session active.
* **⚡ Group Management:** Dynamic admin commands, custom command prefixes, and member management.
* **🌐 Cloud Ready:** Pre-configured for deployment on Koyeb, Render, Katabump, and Pterodactyl hosting panels.

---

## ⚙️ Environment Variables Setup

Configure the following environment variables in your `.env` file or cloud dashboard:

| Variable | Required | Description | Where to get it |
| :--- | :---: | :--- | :--- |
| `SESSION_ID` | **Yes** | Your WhatsApp authentication session string | From your pairing site |
| `BOT_NUMBER` | **Yes** | Phone number assigned to the bot (e.g., `2347077445628`) | Your WhatsApp number |
| `SIGHTENGINE_USER` | **Yes** | API User ID for Anti-Porn image scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `SIGHTENGINE_SECRET` | **Yes** | API Secret Key for Anti-Porn image scanning | [Sightengine Dashboard](https://sightengine.com/) |
| `OWNER_NUMBER` | **Yes** | Main owner's phone number | e.g. `2348058068041` |
| `OWNER_NAME` | Optional | Main owner's display name | e.g. `Rise` |
| `PREFIX` | Optional | Bot command prefix (Default: `.`) | Custom preference |

---

## 🛠️ Environment Configuration Template (`.env`)

Create a `.env` file in your project root folder and paste the following:

```env
# SERVER & BOT CONFIGURATION
PORT=3000
BOT_NAME=Navya
BOT_NUMBER=2347077445628
PREFIX=.
MODE=public
ANTICALL=false

# SESSION & AUTHENTICATION
SESSION_ID=your_session_id_here

# ANTI-PORN API KEYS (Sightengine)
SIGHTENGINE_USER=your_sightengine_user_here
SIGHTENGINE_SECRET=your_sightengine_secret_here

# OWNER DETAILS
OWNER_NAME=Rise
OWNER_NUMBER=2348058068041
OWNERS=2348058068041,2348115336615
OWNER=2348058068041,2348115336615
MODS=2349130961572

# SOCIAL LINKS
INSTAGRAM=[https://www.instagram.com/winterrise](https://www.instagram.com/winterrise)
GITHUB=[https://github.com/juniorwinter6](https://github.com/juniorwinter6)


🚀 Installation & Deployment
Method 1: Local / VPS Setup
1.  Clone the repository:
  git clone [https://github.com/juniorwinter6/Navya-Bot.git](https://github.com/juniorwinter6/Navya-Bot.git)
cd Navya-Bot

2.  Install dependencies:
   npm install

3.  Configure Environment Variables:
   cp .env.example .env
   Open .env in any text editor and fill in your keys.

4.  Start the bot:
   npm start