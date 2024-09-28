import { describe, it, expect, beforeEach, vi } from 'vitest';
import { individualBalanceHandler, groupBalanceHandler } from './balanceHandler';
import { sendMessage, findUser_byUsername } from '../../utils/utils';
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
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('BalanceHandler', () => {
  let prisma: any;
  let chatId: string;
  let messageSender: string;

  beforeEach(() => {
    prisma = new PrismaClient();
    chatId = '1';
    messageSender = 'testuser';
    vi.clearAllMocks();
  });

  describe('individualBalanceHandler', () => {
    it('should return an error message if the user is not part of the group', async () => {
      findUser_byUsername.mockResolvedValue(null);
      await individualBalanceHandler(chatId, messageSender);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'You are not part of this group!');
    });

    it('should return an error message if the user has no balance in the group', async () => {
      findUser_byUsername.mockResolvedValue({ id: 'user1' });
      prisma.userGroupBalance.findUnique.mockResolvedValue(null);
      await individualBalanceHandler(chatId, messageSender);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'You have no balance in this group!');
    });

    it('should return the user\'s balance in the group indicating they owe money', async () => {
      findUser_byUsername.mockResolvedValue({ id: 'user1' });
      prisma.userGroupBalance.findUnique.mockResolvedValue({ balance: 100 });
      await individualBalanceHandler(chatId, messageSender);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'You owe $100.00');
    });

    it('should return the user\'s balance in the group indicating they are owed money', async () => {
      findUser_byUsername.mockResolvedValue({ id: 'user1' });
      prisma.userGroupBalance.findUnique.mockResolvedValue({ balance: -50 });
      await individualBalanceHandler(chatId, messageSender);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'You are owed $50.00');
    });
  });

  describe('groupBalanceHandler', () => {
    it('should return an error message if the group is not found', async () => {
      prisma.group.findUnique.mockResolvedValue(null);
      await groupBalanceHandler(chatId);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'Group not found!');
    });

    it('should return the group balance indicating members owe or are owed money', async () => {
      prisma.group.findUnique.mockResolvedValue({
        id: chatId,
        members: [{ id: 'user1', username: 'user1' }, { id: 'user2', username: 'user2' }],
      });
      prisma.userGroupBalance.findUnique
        .mockResolvedValueOnce({ balance: 50 })
        .mockResolvedValueOnce({ balance: -75 });

      await groupBalanceHandler(chatId);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'The group balance is \nuser1 owes $50.00\nuser2 is owed $75.00');
    });

    it('should handle members with no balance', async () => {
      prisma.group.findUnique.mockResolvedValue({
        id: chatId,
        members: [{ id: 'user1', username: 'user1' }, { id: 'user2', username: 'user2' }],
      });
      prisma.userGroupBalance.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ balance: 75 });

      await groupBalanceHandler(chatId);
      expect(sendMessage).toHaveBeenCalledWith(chatId, 'The group balance is \nuser1 is owed $0.00\nuser2 owes $75.00');
    });
  });
});