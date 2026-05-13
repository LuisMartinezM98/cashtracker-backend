import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/AuthController";
import { handleInputErrors } from "../middleware/validation";
import { limiter } from "../config/limiter";

const router: Router = Router();

router.post(
  "/create-account",
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  handleInputErrors,
  AuthController.createAccount,
);

router.post(
  "/confirm-account",
  limiter,
  body("token").notEmpty().isLength({ min: 6, max: 6}).withMessage("Invalid token"),
  handleInputErrors,
  AuthController.confirmAccount,
);
export default router;
