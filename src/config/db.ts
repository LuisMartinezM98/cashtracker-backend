import { Sequelize} from 'sequelize-typescript';
import dotenv from 'dotenv';

dotenv.config({quiet: true});

export const db = new Sequelize( process.env.DATABASE_URL,{
    models: [__dirname + '/../models/**/*'],
    logging: false,
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});