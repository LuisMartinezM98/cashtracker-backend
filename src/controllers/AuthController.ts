import type { Request, Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/auth";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // prevenir duplicados
    const userExist = await User.findOne({ where: { email } });
    if (userExist) {
      const error = new Error("User already exists");
      return res.status(400).json({ error: error.message });
    }
    try {
      const user = new User(req.body);
      user.password = await hashPassword(password);
      user.token = generateToken();
      AuthEmail.sendConfirmation({
        name: user.name,
        email: user.email,
        token: user.token,
      });
      await user.save();
      res.status(201).json({ message: "Account created successfully" });
    } catch (error) {
      // console.log(error)
      res.status(500).json({ error: "Failed to create account" });
    }
  };
  static confirmAccount = async (req: Request, res: Response) => {
    const { token} = req.body;
    try {
      const user = await User.findOne({ where: { token } });
      if(!user){
        const error = new Error("Invalid token");
        return res.status(400).json({ error: error.message });
      }
      user.token = null;
      user.confirmed = true;
      await user.save();
      res.status(200).json({ message: "Account confirmed successfully" });
    }catch(error){
      // console.log(error)
      res.status(500).json({ error: "Failed to confirm account" });
    }
  }
}
