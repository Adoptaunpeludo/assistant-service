import 'express-async-errors';
import express, { Router } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';

interface Options {
  port: number;
  routes: Router;
}

export class Server {
  public readonly app = express();
  public serverListener?: any;
  private readonly port: number;
  private readonly routes: Router;

  constructor(options: Options) {
    const { port, routes } = options;

    this.port = port;
    this.routes = routes;
  }

  async start() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('tiny'));
    this.app.use(
      cors({
        origin: '*',
      })
    );

    this.app.use(this.routes);

    //* Error Handler Middleware
    this.app.use(ErrorHandlerMiddleware.handle);

    this.serverListener = this.app.listen(this.port, async () => {
      try {
        console.log(`Server running on port ${this.port}`);
      } catch (error) {
        console.log(error);
        console.log('There was an error starting the server');
      }
    });
  }

  public stop() {
    return new Promise((resolve, reject) => {
      this.serverListener.close((error: Error | undefined) => {
        if (error) {
          console.log({ error });
          reject('There was an error closing the server');
        } else {
          console.log('Server closed');
          resolve(true);
        }
      });
    });
  }
}
