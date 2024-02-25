import { Router } from 'express';

export class ChatRoutes {
  static get routes() {
    const router = Router();

    router.post('/user-message');

    return router;
  }
}
