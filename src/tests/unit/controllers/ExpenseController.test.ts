import { createRequest, createResponse } from "node-mocks-http";
import Expense from "../../../models/Expense";
import { ExpensesController } from "../../../controllers/ExpenseController";
import { expenses } from "../../mocks/expenses";

jest.mock("../../../models/Expense", () => {
  return {
    create: jest.fn()
  };
});

describe("ExpenseController.create", () => {
  it("should craete a new expense", async () => {
    const expenseMock = {
      save: jest.fn().mockResolvedValue(true),
    };

    (Expense.create as jest.Mock).mockResolvedValue(expenseMock);
    const req = createRequest({
      method: "POST",
      url: "/api/budgets/:budgetId/expenses",
      body: {
        name: "Test expense",
        amount: 500,
      },
      budget: {
        id: 1,
      },
    });
    const res = createResponse();
    await ExpensesController.create(req, res);
    const data = res._getJSONData();
    expect(res.statusCode).toBe(201);
    expect(data).toEqual({ message: "Expense created successfully" });
    expect(expenseMock.save).toHaveBeenCalled();
    expect(expenseMock.save).toHaveBeenCalledTimes(1);
    expect(Expense.create).toHaveBeenCalledWith(req.body);
  });
  it("should handle errors and return 500 status code", async () => {
    (Expense.create as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      method: "POST",
      url: "/api/budgets/:budgetId/expenses",
      body: {
        name: "Test expense",
        amount: 500,
      },
      budget: {
        id: 1,
      },
    });
    const res = createResponse();
    await ExpensesController.create(req, res);
    const data = res._getJSONData();
    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ error: "Failed to create expense" });
  });
});
describe("ExpenseController.getById", () => {
  it("should return expense with ID = 1", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets/:budgetId/expenses/:expenseId",
      expense: expenses[0],
    });
    const res = createResponse();

    await ExpensesController.getById(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(expenses[0]);
  });
});
describe("ExpenseController.updateById", () => {
  it("should handle expense Update", async () => {
    const expenseMock = {
      ...expenses[0],
      update: jest.fn()
    }
    const req = createRequest({
      method: "PUT",
      url: "/api/budgets/:budgetId/expenses/:expenseId",
      expense: expenseMock,
      body: {
        name: "Updated expense",
        amount: 100,
      },
    });
    const res = createResponse();
    // (Expense.update as jest.Mock).mockResolvedValue(expenseMock)
    await ExpensesController.updateById(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ message: "Expense updated successfully" });
    expect(expenseMock.update).toHaveBeenCalledTimes(1);
    expect(expenseMock.update).toHaveBeenCalledWith(req.body);
  });
  it("should handle errors and return 500 status code", async () => {
    const expenseMock = {
      ...expenses[0],
      update: jest.fn().mockRejectedValue(new Error)
    }
    const req = createRequest({
      method: "PUT",
      url: "/api/budgets/:budgetId/expenses/:expenseId",
      expense: expenseMock,
      body: {
        name: "Updated expense",
        amount: 100,
      },
    });
    const res = createResponse();
    await ExpensesController.updateById(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: "Failed to update expense" });
  });
});
describe("ExpenseController.deleteById", () => {
  it("should handle expense Update", async () => {
    const expenseMock = {
      ...expenses[0],
      destroy: jest.fn()
    }
    const req = createRequest({
      method: "DELETE",
      url: "/api/budgets/:budgetId/expenses/:expenseId",
      expense: expenseMock,
    });
    const res = createResponse();
    await ExpensesController.deleteById(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ message: "Expense deleted successfully" });
    expect(expenseMock.destroy).toHaveBeenCalledTimes(1);
  });
  it("should handle expense Update", async () => {
    const expenseMock = {
      ...expenses[0],
      destroy: jest.fn().mockRejectedValue(new Error)
    }
    const req = createRequest({
      method: "DELETE",
      url: "/api/budgets/:budgetId/expenses/:expenseId",
      expense: expenseMock,
    });
    const res = createResponse();
    await ExpensesController.deleteById(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: "Failed to delete expense" });
  });
});
