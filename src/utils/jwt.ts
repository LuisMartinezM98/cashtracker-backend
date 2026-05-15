import jwt from 'jsonwebtoken';


export const generateJWT = (id: string): string => {
    const token = jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    return token;
}

export const decodedJWT = (token: string) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
}