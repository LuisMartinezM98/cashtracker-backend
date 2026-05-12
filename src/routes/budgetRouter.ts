import { Router } from 'express';
import { body, param } from 'express-validator';
import { BudgetController } from '../controllers/BudgetController';
import { handleInputErrors } from '../middleware/validation';
import { validateBudgetExist, validateBudgetId, validateBudgetInput } from '../middleware/budget';

const router = Router();

router.param('budgetId', validateBudgetId);
router.param('budgetId', validateBudgetExist);

router.get('/', BudgetController.getAll);

router.get('/:budgetId', BudgetController.getById);

router.post('/',
    validateBudgetInput,
    handleInputErrors,
    BudgetController.create);

router.put('/:budgetId', 
    BudgetController.update);

router.delete('/:budgetId', BudgetController.delete);

export default router;