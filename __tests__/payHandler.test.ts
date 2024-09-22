// __tests__/payHandler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';
import { payHandler } from '../src/handlers/payHandler';
import * as utils from '../src/utils/utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const mockGroup = {
  id: '123',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Group',
  members: [
    { id: 'user1', username: 'user1' },
    { id: 'user2', username: 'user2' },
  ],
  transactions: [],
  balances: [
    { id: 'balance1', userId: 'user1', groupId: '123', balance: 100, createdAt: new Date(), updatedAt: new Date() },
    { id: 'balance2', userId: 'user2', groupId: '123', balance: 200, createdAt: new Date(), updatedAt: new Date() },
  ],
};

vi.mock('@prisma/client', () => ({
  default: {
    group: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    userGroupBalance: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/utils', () => ({
  sendMessage: vi.fn(),
  findUser_byUsername: vi.fn(),
}));

describe('payHandler', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      send: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send "Group not found!" if the group does not exist', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue(null);

    await payHandler(['/pay', '10', '@user1'], '123', mockResponse as Response, 'sender');

    expect(utils.sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Group not found!');
  });

  it('should send "Invalid format! Please use /pay [amount] [payee]" if the message format is incorrect', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue(mockGroup);

    await payHandler(['/pay', '10'], '123', mockResponse as Response, 'sender');

    expect(utils.sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Invalid format! Please use /pay [amount] [payee]');
  });

  it('should send "Payee not found!" if the payee is not found', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue(mockGroup);
    vi.spyOn(utils, 'findUser_byUsername').mockResolvedValueOnce({
      createdAt: new Date(),
      updatedAt: new Date(),
      username: "",
      id: 'user1' }).mockResolvedValueOnce(null);

    await payHandler(['/pay', '10', '@user1'], '123', mockResponse as Response, 'sender');

    expect(utils.sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Payee not found!');
  });

  it('should send "You are not part of this group!" if the user is not part of the group', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue(mockGroup);
    vi.spyOn(utils, 'findUser_byUsername').mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
      createdAt: new Date(),
      updatedAt: new Date(),
      username: "",
      id: 'user1' });

    await payHandler(['/pay', '10', '@user1'], '123', mockResponse as Response, 'sender');

    expect(utils.sendMessage).toHaveBeenCalledWith('123', mockResponse, 'You are not part of this group!');
  });

  it('should send a success message if the payment is processed successfully', async () => {
    prisma.group.findUnique = vi.fn().mockResolvedValue({ id: '123', members: [] });
    vi.spyOn(utils, 'findUser_byUsername').mockResolvedValueOnce({
      createdAt: new Date(),
      updatedAt: new Date(),
      username: "user1",
      id: 'user1' }).mockResolvedValueOnce({
      createdAt: new Date(),
      updatedAt: new Date(),
      username: "user2",
      id: 'user2' });

    await payHandler(['/pay', '10', '@user1'], '123', mockResponse as Response, 'sender');

    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(prisma.userGroupBalance.update).toHaveBeenCalledTimes(2);
    expect(utils.sendMessage).toHaveBeenCalledWith('123', mockResponse, 'Successfully paid 10 to @user1');
  });

  // Add more tests for other scenarios
});