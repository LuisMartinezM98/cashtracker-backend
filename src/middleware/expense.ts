import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import Expense from "../models/Expense";

declare global {
  namespace Express {
    interface Request {
      expense?: Expense;
    }
  }
}

export const validateExpenseInput = async (
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

export const validateExpenseId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await param("expenseId")
    .isInt()
    .custom((value) => value > 0)
    .withMessage("Invalid ID")
    .run(req);

  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};

export const validateExpenseExist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { expenseId } = req.params;
  try {
    const expense = await Expense.findByPk(+expenseId);
    if (!expense) {
      const error = new Error("Expense not found");
      return res.status(404).json({ error: error.message });
    }
    req.expense = expense;

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
