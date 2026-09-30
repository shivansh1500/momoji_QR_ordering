import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { seedDatabase } from './config/seed.js';
import { env } from './config/env.js';
import { initSockets } from './sockets/socketManager.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

initSockets(io);

app.use('/api/auth', authRoutes);
app.use('/api', customerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

app.use(errorHandler);

async function startServer() {
  await connectDB();
  await seedDatabase();

  const PORT = env.PORT;
  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Momoji Server running in ${env.NODE_ENV} mode`);
    console.log(`Local link: http://localhost:${PORT}`);
    console.log(`CORS Client Origin: ${env.CLIENT_ORIGIN}`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
