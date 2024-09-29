import { describe, it, expect, beforeEach, vi } from 'vitest';
import { payHandler } from './payHandler';
import { sendMessage, findUser_byUsername } from '../../utils/telegramUtils';
import { PrismaClient } from '@prisma/client';

vi.mock('../../utils/utils', () => ({
  sendMessage: vi.fn(),
  findUser_byUsername: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    group: {
      findUnique: vi.fn(),
    },
    userGroupBalance: {
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('payHandler', () => {
  let prisma: any;
  let chatId: string;
  let messageSender: string;

  beforeEach(() => {
    prisma = new PrismaClient();
    chatId = '1';
    messageSender = 'testuser';
    vi.clearAllMocks();
  });

  it('should return an error message if the group is not found', async () => {
    prisma.group.findUnique.mockResolvedValue(null);
    const messageArray = ['/pay', '10', '@user1'];
    await payHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Group not found!');
  });

  it('should return an error message if the format is invalid', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId });
    const messageArray = ['/pay', '10'];
    await payHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Invalid format! Please use /pay [total amount] [payee]');
  });

  it('should return an error message if the payee is not found', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId });
    findUser_byUsername.mockResolvedValue(null);
    const messageArray = ['/pay', '10', '@user1'];
    await payHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Payee not found!');
  });

  it('should return an error message if the user is not part of the group', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId });
    findUser_byUsername.mockResolvedValueOnce({ id: 'user1' }).mockResolvedValueOnce(null);
    const messageArray = ['/pay', '10', '@user1'];
    await payHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'You are not part of this group!');
  });

  it('should create a transaction and update balances correctly', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId });
    findUser_byUsername.mockResolvedValueOnce({ id: 'user2', username: 'user2' }).mockResolvedValueOnce({ id: 'user1', username: 'user1' });
    const messageArray = ['/pay', '10', '@user2'];
    await payHandler(messageArray, chatId, messageSender);

    expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        totalAmount: 10,
        description: 'Payment from user1 to user2',
        type: 'REPAYMENT',
      }),
    }));
    expect(prisma.userGroupBalance.update).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Successfully paid 10 to @user2');
  });
});