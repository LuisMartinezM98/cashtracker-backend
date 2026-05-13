import type { Request, Response } from "express";
import Expense from "../models/Expense";

export class ExpensesController {

  static create = async (req: Request, res: Response) => {
    try{
      const expense = new Expense(req.body);
      expense.budgetId = req.budget.id;
      await expense.save();
      res.status(201).json({ message: 'Expense created successfully' });
    }catch(error){
      res.status(500).json({ error: 'Failed to create expense' });
    }
  };

  static getById = async (req: Request, res: Response) => {
    res.json(req.expense);
  };

  static updateById = async (req: Request, res: Response) => {
    const { name, amount } = req.body;
    try {
      await req.expense.update({ name, amount });
      res.json({ message: 'Expense updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update expense' });
    }
  };

  static deleteById = async (req: Request, res: Response) => {
    try {
      await req.expense.destroy();
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  };
}
