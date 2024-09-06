import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import packageJson from '../package.json' with { type: 'json' };

const app = new Elysia().use(
  swagger({
    path: '/',
    documentation: {
      info: {
        title: 'Sherlock Client',
        description:
          'A simple username search service, powered by sherlock and built with Elysia',
        version: packageJson.version,
      },
    },
  }),
);

export default app;
