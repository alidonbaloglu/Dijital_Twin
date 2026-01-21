import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stationsRouter from './routes/stations';
import layoutsRouter from './routes/layouts';
import componentsRouter from './routes/components';

// Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // SVG içerikleri için limit artırıldı
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/stations', stationsRouter);
app.use('/api/layouts', layoutsRouter);
app.use('/api/components', componentsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - Stations: http://localhost:${PORT}/api/stations`);
  console.log(`   - Layouts:  http://localhost:${PORT}/api/layouts`);
  console.log(`   - Components: http://localhost:${PORT}/api/components`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;

