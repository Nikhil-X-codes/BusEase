import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';   
import compression from 'compression';

const app = express();
app.set('trust proxy', 1);
app.set('etag', 'weak');
app.use(compression({ threshold: 1024 }));

// Lightweight response time logging
app.use((req, res, next) => {
    const startTimeNs = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startTimeNs) / 1e6;
        const route = req.originalUrl || req.url;
        console.log(`[RESPTIME] ${req.method} ${route} -> ${res.statusCode} in ${durationMs.toFixed(1)}ms`);
    });
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}))

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '100kb'
}));


app.use(express.static('public'));
app.use(cookieParser());

app.get(['/', '/health', '/api/v1', '/api/v1/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BusEase Backend API is running' });
});


import userRouter from './routes/user.routes.js';
import BookRouter from './routes/book.routes.js';
import RouteRouter from './routes/route.routes.js';
import PaymentRouter from './routes/Payment.routes.js';
import maintenanceRouter from './routes/maintenance.routes.js';
import busSearchRouter from './routes/bus-search.routes.js';
import adminRouter from './routes/admin.routes.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/book', BookRouter);
app.use('/api/v1/routes', RouteRouter);
app.use('/api/v1/payments', PaymentRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/buses', busSearchRouter);
app.use('/api/v1/admin', adminRouter);

export default app;