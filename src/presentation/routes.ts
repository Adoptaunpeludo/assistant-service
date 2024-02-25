import { Router } from 'express';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/chat');

    return router;
  }
}
