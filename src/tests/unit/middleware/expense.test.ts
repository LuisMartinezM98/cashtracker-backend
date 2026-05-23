import { createRequest, createResponse } from "node-mocks-http";
import { validateExpenseExist } from "../../../middleware/expense";
import Expense from "../../../models/Expense";
import { expenses } from "../../mocks/expenses";
import { hasAcces } from "../../../middleware/budget";
import { budgets } from "../../mocks/budgets";

jest.mock("../../../models/Expense", () => ({
  findByPk: jest.fn(),
}));

describe("Expenses Middleware - validateExpenseExist", () => {
  beforeEach(() => {
    (Expense.findByPk as jest.Mock).mockImplementation((id) => {
      const expense = expenses.filter((e) => e.id === id)[0] ?? null;
      return Promise.resolve(expense);
    });
  });
  it("should handle a non-existent expense", async () => {
    const req = createRequest({
      params: { expenseId: 100 },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateExpenseExist(req, res, next);
    const data = res._getJSONData();
    expect(res.statusCode).toBe(404);
    expect(data).toEqual({
      error: "Expense not found",
    });
    expect(next).not.toHaveBeenCalled();
  });
  it("should handle a existent expense", async () => {
    const req = createRequest({
      params: { expenseId: 1 },
    });
    const res = createResponse();
    const next = jest.fn();
    await validateExpenseExist(req, res, next);
    expect(res.statusCode).toBe(200);
    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.expense).toEqual(expenses[0]);
  });
  it("should handle errors", async () => {
    (Expense.findByPk as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      params: { expenseId: 1 },
    });
    const res = createResponse();
    const next = jest.fn();
    await validateExpenseExist(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: "Internal server error" });
    expect(next).not.toHaveBeenCalled();
  });
  it("should prevent unauthorized user from adding expenses", async () => {
    const req = createRequest({
      method: "POST",
      url: "/budgets/:budgetId/expenses",
      budget: budgets[0],
      user: { id: 20 },
      body: {
        name: "Expense test",
        amount: 3000,
      },
    });
    const res = createResponse();
    const next = jest.fn();
    hasAcces(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
