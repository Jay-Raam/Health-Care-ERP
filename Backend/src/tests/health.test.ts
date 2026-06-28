import request from 'supertest';
import { createApp } from '../server.js';

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn().mockResolvedValue({}),
    connection: {
      ...actual.connection,
      readyState: 1 // Connected
    }
  };
});

// Mock redis status
jest.mock('../shared/cache/redis', () => ({
  checkRedisStatus: () => true,
  getRedisClient: () => ({
    call: jest.fn().mockResolvedValue('OK')
  }),
  initRedis: () => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue({})
  })
}));

// Mock BullMQ queues
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      client: Promise.resolve({}),
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
    })),
    Worker: jest.fn()
  };
});

describe('REST API - Health Check', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  it('should return 200 OK and correct JSON structure', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.services).toEqual({
      database: 'UP',
      cache: 'UP',
      queues: 'UP'
    });
    expect(res.body).toHaveProperty('metrics');
  });
});
