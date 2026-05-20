import { createRequest, createResponse } from "node-mocks-http";
import { hasAcces, validateBudgetExist } from "../../../middleware/budget";
import Budget from "../../../models/Budget";
import { budgets } from "../../mocks/budgets";

jest.mock("../../../models/Budget", () => {
  return {
    findByPk: jest.fn(),
  };
});

describe("budget - validateBudgetExist", () => {
  it("should handle non-existent budget", async () => {
    (Budget.findByPk as jest.Mock).mockResolvedValue(null);
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateBudgetExist(req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({
      error: "Budget not found",
    });
    expect(next).not.toHaveBeenCalled();
  });
  it("should proceed to next middleware if budget exists", async () => {
    (Budget.findByPk as jest.Mock).mockResolvedValue(budgets[0]);
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();
    await validateBudgetExist(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.budget).toEqual(budgets[0]);
  });
  it("should handle errors", async () => {
    (Budget.findByPk as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateBudgetExist(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: "Internal server error",
    });
  });
});
describe("budget - hasAcces", () => {
  it("should return 401 if user does not have access to budget", async () => {
    const req = createRequest({
      budget: budgets[0],
      user: {
        id: 2,
      },
    });
    const res = createResponse();
    const next = jest.fn();
    await hasAcces(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      error: "Unauthorized",
    });
  });
  it("should call next if user has access to budget", async () => {
    const req = createRequest({
      budget: budgets[0],
      user: {
        id: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();
    await hasAcces(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});