const axios = require('axios');
require('dotenv').config({ path: '../Backend/.env' });

const { LOG_API_URL, LOG_API_TOKEN } = process.env;

async function Log(stack, level, pkg, message) {
  if (!LOG_API_URL || !LOG_API_TOKEN) {
    console.error('Logger is not configured. Skipping log.');
    return;
  }

  try {
    const logData = { stack, level, package: pkg, message };
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOG_API_TOKEN}`,
      },
    };
    await axios.post(LOG_API_URL, logData, config);
  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    console.error('Failed to send log to evaluation service:', errorMsg);
  }
}

module.exports = { Log };