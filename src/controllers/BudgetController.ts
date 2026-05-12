import type { Request, Response } from 'express';
import Budget from '../models/Budget';


export class BudgetController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const budgets = await Budget.findAll({
                order: [['createdAt', 'DESC']],

                //TODO: Filtrar por el usuario autenticado y agregrar paginación
            });
            res.json(budgets);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch budgets' });
        }
    }
    static getById = async (req: Request, res: Response) => {
        res.json(req.budget);
    }
    static create = async (req: Request, res: Response) => {
        try {
            const budget = new Budget(req.body);
            await budget.save();
            res.status(201).json({ message: 'Budget created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create budget' });
        }
    }
    static update = async (req: Request, res: Response) => {
        const { name, amount } = req.body;
        try {
            await req.budget.update({ name, amount });
            res.json({ message: 'Budget updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update budget' });
        }
    }
    static delete = async (req: Request, res: Response) => {
        try {
            await req.budget.destroy();
            res.json({ message: 'Budget deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete budget' });
        }
    }

}