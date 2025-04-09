export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    security: {
        corsOrigin: process.env.CORS_ORIGIN || '*',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
      },      
  });
  