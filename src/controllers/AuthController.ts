import type { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // prevenir duplicados
    const userExist = await User.findOne({ where: { email } });
    if (userExist) {
      const error = new Error("User already exists");
      return res.status(409).json({ error: error.message });
    }
    try {
      const user = await User.create(req.body);
      user.password = await hashPassword(password);
      const token = generateToken();

      if (process.env.NODE_ENV !== "production") {
        globalThis.cashTrackrConfirmationToken = token;
      }

      user.token = token;
      await AuthEmail.sendConfirmation({
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
    const { token } = req.body;
    try {
      const user = await User.findOne({ where: { token } });
      if (!user) {
        const error = new Error("Invalid token");
        return res.status(400).json({ error: error.message });
      }
      user.token = null;
      user.confirmed = true;
      await user.save();
      res.status(200).json({ message: "Account confirmed successfully" });
    } catch (error) {
      // console.log(error)
      res.status(500).json({ error: "Failed to confirm account" });
    }
  };
  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // user exist
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error("User does not exist");
      return res.status(404).json({ error: error.message });
    }
    if (!user.confirmed) {
      const error = new Error("Account not confirmed");
      return res.status(403).json({ error: error.message });
    }
    const validPassword = await checkPassword(password, user.password);
    if (!validPassword) {
      const error = new Error("Invalid password");
      return res.status(401).json({ error: error.message });
    }
    // generate token
    const jwt = generateJWT(user.id);
    res.json(jwt);
  };
  static forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    // user exist
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error("User does not exist");
      return res.status(404).json({ error: error.message });
    }
    user.token = generateToken();
    await user.save();
    await AuthEmail.sendPasswordResetToken({
      name: user.name,
      email: user.email,
      token: user.token,
    });
    res.status(200).json({ message: "Password reset token sent to email" });
  };
  static validateToken = async (req: Request, res: Response) => {
    const { token } = req.body;
    const tokenExist = await User.findOne({ where: { token } });
    if (!tokenExist) {
      const error = new Error("Invalid token");
      return res.status(404).json({ error: error.message });
    }
    res.json({ message: "Valid token" });
  };
  static resetPasswordWithToken = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({ where: { token } });
    if (!user) {
      const error = new Error("Invalid token");
      return res.status(404).json({ error: error.message });
    }
    // new password
    user.password = await hashPassword(password);
    user.token = null;
    await user.save();
    res.json({ message: "Password reset successfully" });
  };

  static getUser = async (req: Request, res: Response) => {
    res.json(req.user);
  };

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body;
    const { id } = req.user;
    const user = await User.findByPk(id);
    const validPassword = await checkPassword(current_password, user.password);
    if (!validPassword) {
      const error = new Error("Invalid password");
      return res.status(401).json({ error: error.message });
    }
    try {
      user.password = await hashPassword(password);
      await user.save();
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  };

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body;
    const { id } = req.user;
    try {
      const user = await User.findByPk(id);
      const validPassword = await checkPassword(password, user.password);
      if (!validPassword) {
        const error = new Error("Invalid password");
        return res.status(401).json({ error: error.message });
      } else {
        res.json({ message: "Password is valid" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to check password" });
    }
  };

  static updateUserInfo = async (req: Request, res: Response) => {
    const { name, email } = req.body;
    try {
      const isEmailUsed = await User.findOne({ where: { email } });
      if (isEmailUsed && email !== req.user.email) {
        const error = new Error("Email is already in use");
        return res.status(409).json({ error: error.message });
      }
      await req.user.update({ name, email });
      return res.status(200).json({
        message: "Profile updated successfully",
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
