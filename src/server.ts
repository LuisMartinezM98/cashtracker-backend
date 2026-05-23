import express, { Application } from 'express'
import colors from 'colors'
import morgan from 'morgan'
import { db } from './config/db'
import budgetRouter from './routes/budgetRouter';
import authRouter from './routes/authRouter';


export async function connectDB() {
    try {
        await db.authenticate();
        await db.sync();
        // console.log(colors.green.bold('Database connected successfully'))
    } catch (error) {
        // console.log(colors.red.bold('Database connection failed'))
    }
}

const app: Application = express();
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/budgets', budgetRouter);
app.use('/api/auth', authRouter);
app.get('/', (req, res) => {
    res.send('Hello World')
})


export default app;