import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

type TransportConfig = {
    host: string,
    port: number,
    auth: {
        user: string,
        pass: string
    }
}


const config = (): TransportConfig => {
  return {
    host: process.env.NODEMAILER_HOST,
    port: +process.env.NODEMAILER_PORT,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  };
};

export const transport = nodemailer.createTransport(config());
