const mongoose = require('mongoose');
const dns = require('dns');

// Force public DNS servers that support SRV records.
// Required on networks (university, corporate) that block or refuse SRV lookups.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined. Check your .env file.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        family: 4,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (isLast) {
        console.error('❌ All connection attempts exhausted. Shutting down.');
        process.exit(1);
      }
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    }
  }
};

module.exports = connectDB;
