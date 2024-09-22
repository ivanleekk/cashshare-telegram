// __tests__/addHandler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { addHandler } from '../src/handlers/addHandler';
import { sendMessage, findUser_byUsername } from '../src/utils/utils';

vi.mock('@prisma/client');
vi.mock('../src/utils/utils');
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    group: {
      findUnique: vi.fn(),
    },
    userGroupBalance: {
      findMany: vi.fn(),
    },
  })),
}));

const prisma = new PrismaClient();

describe('addHandler', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      send: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send "Invalid format!" if the message format is incorrect', async () => {
    await addHandler(['/add', '10'], '123', mockResponse as Response, 'sender');

    expect(sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Invalid format! Please use /add [amount] [description] [people]');
  });

  it('should send "Invalid format! Please use @username for all users involved." if not all people are valid', async () => {
    await addHandler(['/add', '10', 'description', 'user1'], '123', mockResponse as Response, 'sender');

    expect(sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Invalid format! Please use @username for all users involved.');
  });

  it('should send "Cashshare Bot is not initialized for this group! Use /start to initialize." if the group does not exist', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue(null);

    await addHandler(['/add', '10', 'description', '@user1'], '123', mockResponse as Response, 'sender');

    expect(sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Cashshare Bot is not initialized for this group! Use /start to initialize.');
  });
  

  // Add more tests for other scenarios
});