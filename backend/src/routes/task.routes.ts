import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const taskController = new TaskController();

router.use(authenticate); // All task routes require authentication

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/dashboard', taskController.getDashboard);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;

