import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createYoga, createSchema } from 'graphql-yoga';
import { config } from './config/index.js';
import { logger, logContext } from './shared/logs/logger.js';
import { typeDefs } from './graphql/typeDefs/index.js';
import { resolvers } from './graphql/resolvers/index.js';
import { createContext } from './graphql/context.js';
import { expressErrorHandler, formatYogaError } from './shared/middleware/errorHandler.js';
import { globalLimiter, graphqlLimiter } from './shared/middleware/rateLimiter.js';
import healthRouter from './shared/routes/health.js';
import uploadRouter from './shared/routes/upload.js';

export const createApp = (): express.Application => {
  const app = express();

  // Basic Middlewares
  app.use(helmet({
    // Permit GraphQL playground/GraphiQL to load inline scripts in development
    contentSecurityPolicy: config.NODE_ENV === 'development' ? false : undefined
  }));
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Development request logger
  if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Request ID tracer middleware
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
    res.setHeader('X-Request-ID', requestId);
    
    // Bind into Thread Local Log Context
    logContext.run({ requestId }, () => {
      next();
    });
  });

  // Rate Limiting
  app.use(globalLimiter);

  // REST Routes
  app.use('/api', healthRouter);
  app.use('/api', uploadRouter);
  
  // Serve uploaded static files
  app.use('/static/uploads', express.static(path.resolve('storage', 'uploads')));

  // GraphQL Yoga Server Configuration
  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers: resolvers as any
    }),
    context: createContext as any,
    graphqlEndpoint: '/graphql',
    landingPage: true, // Show GraphiQL in browser
    maskedErrors: {
      maskError(error: any) {
        return formatYogaError(error);
      }
    }
  });

  // Apply GraphQL specific rate limiter to the route
  app.use(yoga.graphqlEndpoint, graphqlLimiter, (req, res) => {
    // Production Introspection Shield
    if (config.NODE_ENV === 'production') {
      const queryStr = (req.body?.query || '').toLowerCase();
      if (queryStr.includes('__schema') || queryStr.includes('__type')) {
        res.status(400).json({
          errors: [{ message: 'GraphQL Introspection is disabled in production.' }]
        });
        return;
      }
    }
    yoga(req, res);
  });

  // Global Error Handler
  app.use(expressErrorHandler);

  return app;
};
