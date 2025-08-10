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



export default app;