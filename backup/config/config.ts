export const config = () => ({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  cors: process.env.CORS === 'true',
  logger: process.env.LOGGER === 'true',
  database: {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
});
