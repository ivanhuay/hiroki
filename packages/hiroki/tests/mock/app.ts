import express, { Request, Response } from 'express';
import models from './models/index';
import hiroki from '../../src';

const app = express();

// Note: Connection to MongoDB is handled by tests/setup.ts using mongodb-memory-server

// Configure models with hiroki
Object.keys(models).forEach((modelName) => {
  let options: any = modelName === 'Draws' ? { fastUpdate: 'enabled' } : {};
  
  if (modelName === 'Invisible') {
    options = {
      disabledMethods: ['get']
    };
  }
  
  hiroki.importModel((models as any)[modelName], options);
});

// Body parser middleware (built-in with Express 4.16+)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Hiroki route handler
app.use('/api/*', async (req: Request, res: Response) => {
  const path = req.originalUrl;
  const resp = await hiroki.process(path, {
    method: req.method as any,
    body: req.body
  });
  res.status(resp.status || 200).json(resp);
});

export default app;
