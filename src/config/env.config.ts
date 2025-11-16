import dotenv from 'dotenv';

dotenv.config();

export const SERVER_PORT = process.env.SERVER_PORT || 3000;
export const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_TOKEN;
export const ENV = {
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASS: process.env.MONGO_PASS,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_DB: process.env.MONGO_DB,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT), // Convertimos a número
  SMTP_SECURE: process.env.SMTP_SECURE === 'true', // Convertimos a booleano
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
};
