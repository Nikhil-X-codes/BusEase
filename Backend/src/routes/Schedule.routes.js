import Router from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

import {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule
} from '../Controllers/schedule.controller.js'

const ScheduleRouter = Router();

ScheduleRouter.post('/create', verifyJWT, createSchedule);
ScheduleRouter.get('/all', getSchedules);
ScheduleRouter.get('/:id', getScheduleById);
ScheduleRouter.put('/update/:id', verifyJWT, updateSchedule);
ScheduleRouter.delete('/delete/:id', verifyJWT, deleteSchedule);

export default ScheduleRouter;