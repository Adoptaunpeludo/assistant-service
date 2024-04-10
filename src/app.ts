import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';

(async () => {
  await main();
})();

async function main() {
  const server = new Server({
    port: envs.PORT,
    jwtSeed: envs.JWT_SEED,
    routes: AppRoutes.routes,
  });

  server.start();
}
