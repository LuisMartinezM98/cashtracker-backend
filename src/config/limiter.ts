import { rateLimit } from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    limit: 5,
    message: {"error": "Too many requests, please try again later"}
})