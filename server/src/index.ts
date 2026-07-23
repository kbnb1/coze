import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import accountsRouter from "./routes/accounts.js";
import ordersRouter from "./routes/orders.js";
import securityRouter from "./routes/security.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/accounts', accountsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/security', securityRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
