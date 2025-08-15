import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';   

const app = express();

app.use(cors());

app.use(express.json({
    limit: '20mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '20mb'
}));


app.use(express.static('public'));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Backend is running');
});


import userRouter from './routes/user.routes.js';
import BookRouter from './routes/book.routes.js';
import RouteRouter from './routes/route.routes.js';
import ScheduleRouter from './routes/Schedule.routes.js';
import PaymentRouter from './routes/Payment.routes.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/book', BookRouter);
app.use('/api/v1/routes', RouteRouter);
app.use('/api/v1/schedules', ScheduleRouter);
app.use('/api/v1/payments', PaymentRouter);

export default app;