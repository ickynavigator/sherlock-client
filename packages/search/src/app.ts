import { swagger } from '@elysiajs/swagger';
import { Elysia, t } from 'elysia';

import Sherlock from './lib/sherlock';
import Store from './lib/store';
import Queue from './lib/queue';

import packageJson from '../package.json' with { type: 'json' };

const SWAGGER_TAGS = {
  search: 'Search',
};

const app = new Elysia()
  .use(
    swagger({
      path: '/',
      documentation: {
        info: {
          title: 'Sherlock Client',
          description:
            'A simple username search service, powered by sherlock and built with Elysia',
          version: packageJson.version,
        },
        components: {
          schemas: {
            UserResult: {
              type: 'object',
              description: 'The formatted search result from sherlock',
              properties: {
                org: {
                  type: 'string',
                  example: 'the_platform',
                  description: 'The organization of the username',
                },
                url: {
                  type: 'string',
                  example: 'https://the_platform.com/johndoe',
                  description: 'The link to the user profile',
                },
                original: {
                  type: 'string',
                  example:
                    '[+] the_platform: https://www.the_platform.com/user/johndoe/',
                  description: 'The original sherlock search query',
                },
              },
            },
          },
        },
      },
    }),
  )
  .state('store', new Store())
  .state('queue', new Queue())
  .decorate('sherlock', new Sherlock())
  .post(
    'search/:username',
    async handler => {
      const username = handler.params.username.trim();
      const ignoreCache = handler.query?.ignoreCache ?? false;

      const isInQueue = await handler.store.queue.isInQueue(username);

      if (isInQueue) {
        handler.set.status = 409;

        return {
          message: 'The username is already in the queue',
        };
      }

      await handler.store.queue.enqueue(username);

      if (ignoreCache) {
        await handler.store.store.deleteUser(username);
      }

      const search = await handler.sherlock.search(username);
      const result = await handler.store.store.addUser(username, search);

      await handler.store.queue.dequeue(username);

      return result;
    },
    {
      params: t.Object({
        username: t.String(),
      }),
      query: t.Object({
        ignoreCache: t.Boolean({ default: false }),
      }),

      detail: {
        tags: [SWAGGER_TAGS.search],
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: {
              type: 'string',
              example: 'johndoe',
            },

            description: 'The username to search for.',
          },
          {
            in: 'query',
            name: 'ignoreCache',
            required: false,
            schema: {
              type: 'boolean',
              example: 'true',
            },

            description:
              'Should ignore the cached searches. This will make a new search and update the cache.',
            allowEmptyValue: true,
          },
        ],
        responses: {
          200: {
            description: 'User search results',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/UserResult',
                  },
                  description:
                    'A list of all the search results gotten from the sherlock search',
                },
              },
            },
          },
          409: {
            description: 'Username already in the queue',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'The username is already in the queue',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  )
  .get(
    'search/:username',
    async handler => {
      const username = handler.params.username.trim();
      const user = await handler.store.store.getUser(username);

      if (user === undefined) {
        handler.set.status = 404;

        return {
          message:
            'The username has not been processed yet. Please create a search request',
        };
      }

      return user;
    },
    {
      params: t.Object({
        username: t.String(),
      }),

      detail: {
        tags: [SWAGGER_TAGS.search],
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: {
              type: 'string',
              example: 'johndoe',
            },

            description: 'The username to search for.',
          },
        ],
        responses: {
          200: {
            description: 'User search results',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/UserResult',
                  },
                  description:
                    'A list of all the search results gotten from the sherlock search',
                },
              },
            },
          },
          404: {
            description: 'Username not in queue or store',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example:
                        'The username has not been processed yet. Please create a search request',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  )
  .get(
    'search/:username/status',
    async handler => {
      const username = handler.params.username.trim();
      const isInQueue = await handler.store.queue.isInQueue(username);

      if (isInQueue) {
        handler.set.status = 202;

        return {
          message: 'The username is still being processed',
        };
      }

      const userInStore = await handler.store.store.isInStore(username);

      if (userInStore) {
        handler.set.status = 200;

        return {
          message:
            'The username has been processed. You can now get the results',
          results: `/search/${username}/results`,
        };
      }

      return {
        message:
          'The username has not been processed yet. Please create a search request',
      };
    },
    {
      params: t.Object({
        username: t.String(),
      }),

      detail: {
        tags: [SWAGGER_TAGS.search],
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: {
              type: 'string',
              example: 'johndoe',
            },

            description: 'The username to search for.',
          },
        ],
        responses: {
          200: {
            description: 'User search status',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example:
                          'The username has been processed. You can now get the results',
                      },
                      results: {
                        type: 'string',
                        example: '/search/johndoe/results',
                      },
                    },
                  },
                  description:
                    'A list of all the search results gotten from the sherlock search',
                },
              },
            },
          },
          202: {
            description: 'Username already in the queue',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'The username is already in the queue',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  )
  .get(
    'debug',
    async handler => {
      const store = await handler.store.store.debug();
      const queue = await handler.store.queue.debug();

      // eslint-disable-next-line no-console
      console.debug(store, queue);

      return {
        store,
        queue,
      };
    },
    {
      detail: {
        tags: [SWAGGER_TAGS.debug],
        responses: {
          200: {
            description: 'Debug information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    store: {
                      description: 'The current store state',
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    queue: {
                      description: 'The current queue state',
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  );
export default app;
