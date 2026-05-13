import { Router } from "express";
import { body, param } from "express-validator";
import { BudgetController } from "../controllers/BudgetController";
import { handleInputErrors } from "../middleware/validation";
import {
  validateBudgetExist,
  validateBudgetId,
  validateBudgetInput,
} from "../middleware/budget";
import { ExpensesController } from "../controllers/ExpenseController";
import { validateExpenseId, validateExpenseInput, validateExpenseExist } from "../middleware/expense";

const router: Router = Router();

router.param("budgetId", validateBudgetId);
router.param("budgetId", validateBudgetExist);
router.param("expenseId", validateExpenseId);
router.param("expenseId", validateExpenseExist);

/**Roues for budgets */

router.get("/", BudgetController.getAll);

router.get("/:budgetId", BudgetController.getById);

router.post(
  "/",
  validateBudgetInput,
  handleInputErrors,
  BudgetController.create,
);

router.put("/:budgetId", BudgetController.update);

router.delete("/:budgetId", BudgetController.delete);

/**Roues for expenses */

router.post(
  "/:budgetId/expenses",
  validateExpenseInput,
  handleInputErrors,
  ExpensesController.create,
);

router.get("/:budgetId/expenses/:expenseId", ExpensesController.getById);

router.put(
  "/:budgetId/expenses/:expenseId",
  validateBudgetInput,
  handleInputErrors,
  ExpensesController.updateById,
);

router.delete("/:budgetId/expenses/:expenseId", ExpensesController.deleteById);

export default router;
