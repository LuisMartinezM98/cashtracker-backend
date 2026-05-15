import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import Budget from "../models/Budget";

declare global {
  namespace Express {
    interface Request {
      budget?: Budget;
    }
  }
}

export const validateBudgetId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await param("budgetId")
    .isInt()
    .withMessage("Invalid ID")
    .custom((value) => value > 0)
    .withMessage("Invalid ID")
    .run(req);
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateBudgetExist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { budgetId } = req.params;
  try {
    const budget = await Budget.findByPk(+budgetId);
    if (!budget) {
      const error = new Error("Budget not found");
      return res.status(404).json({ error: error.message });
    }
    req.budget = budget;

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const validateBudgetInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await body("name").notEmpty().withMessage("Name is required").run(req);
  await body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Amount must be greater than 0")
    .run(req);
  next();
};

export async function hasAcces(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.budget.userId !== req.user.id) {
    const error = new Error("Unauthorized");
    return res.status(401).json({ error: error.message });
  }
  next();
}
