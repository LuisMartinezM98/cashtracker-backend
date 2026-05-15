import type { Request, Response, NextFunction} from 'express';
import { decodedJWT } from '../utils/jwt';
import User from '../models/User';


declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req : Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;
    if(!bearer){
      const error = new Error('Unauthorized');
      return res.status(401).json({ error: error.message });
    }
    const [, token] = bearer.split(' ');
    if(!token){
      const error = new Error('Invalid token');
      return res.status(401).json({ error: error.message });
    }
    try{
      const decoded = decodedJWT(token);
      if(typeof decoded === 'object' && decoded.id){
        req.user = await User.findByPk(decoded.id, {
          attributes:['id', 'name', 'email']
        });
        next()
      }
    }catch(error){
      res.status(500).json({ error: 'Failed to get user' });
    }
}