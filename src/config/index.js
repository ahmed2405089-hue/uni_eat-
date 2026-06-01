module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/unieats',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_dev_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpiresIn: Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
