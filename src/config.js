require("dotenv").config();

const config = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  SPECIAL_USER_ID: process.env.SPECIAL_USER_ID, // Telegram user/chat ID for "darling" mode
};

// Validate required keys on startup
const required = ["TELEGRAM_TOKEN", "NVIDIA_API_KEY", "SPECIAL_USER_ID"];
for (const key of required) {
  if (!config[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

module.exports = config;
