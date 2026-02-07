
import express from 'express';
import cors from 'cors';
import './db'; // Initialize env and db
import apiRoutes from './routes/api';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Lendwise LOS API is running');
});

// Export app for Vercel serverless
export default app;

// Listen when running as standalone server (Railway, Render, local) - not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
