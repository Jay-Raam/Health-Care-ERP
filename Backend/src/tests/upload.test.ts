import request from 'supertest';
import { createApp } from '../server.js';
import path from 'path';
import fs from 'fs';

// Mock authorization token decoding
jest.mock('jsonwebtoken', () => ({
  verify: () => ({
    id: 'mock-user-id',
    email: 'test@example.com',
    role: 'PATIENT',
    permissions: ['*']
  })
}));

// Mock Redis status and token blacklisting
jest.mock('../shared/cache/redis', () => ({
  checkRedisStatus: () => true,
  cacheGet: () => null, // Token not blacklisted
  getRedisClient: () => ({
    call: jest.fn().mockResolvedValue('OK')
  }),
  initRedis: () => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue({})
  })
}));

// Mock sharp image processing
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({})
  }));
});

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    client: Promise.resolve({}),
    add: jest.fn().mockResolvedValue({ id: 'mock-job' })
  })),
  Worker: jest.fn()
}));

describe('REST API - File Upload', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  it('should return 401 Unauthorized if authorization header is missing', async () => {
    await request(app)
      .post('/api/upload')
      .expect(401);
  });

  it('should accept file and return 200 OK when authenticated', async () => {
    const dummyBuffer = Buffer.from('dummy file content');
    
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer dummy-token')
      .attach('file', dummyBuffer, 'avatar.png')
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'File uploaded and processed successfully');
    expect(res.body.data).toHaveProperty('filename');
    expect(res.body.data).toHaveProperty('url');
  });

  it('should return 400 Bad Request if file extension is not allowed', async () => {
    const dummyBuffer = Buffer.from('dummy content');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer dummy-token')
      .attach('file', dummyBuffer, 'malicious.exe')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
