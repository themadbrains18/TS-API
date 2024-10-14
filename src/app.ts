import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api', router);



// Error handling can be added here if needed

export default app;
