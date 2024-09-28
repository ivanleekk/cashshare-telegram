import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addHandler } from './addHandler';
import { sendMessage, findUser_byUsername } from '../utils/utils';
import { PrismaClient } from '@prisma/client';
import resetAllMocks = jest.resetAllMocks;

vi.mock('../utils/utils', () => ({
    sendMessage: vi.fn(),
    findUser_byUsername: vi.fn(),
}));
vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    group: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    userGroupBalance: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('addHandler', () => {
  let prisma: any;
  let chatId: string;
  let messageSender: string;

  beforeEach(() => {
    prisma = new PrismaClient();
    chatId = '1';
    messageSender = 'testuser';
    vi.clearAllMocks();
  });

  it('should return an error message if the format is invalid', async () => {
    const messageArray = ['/add', '10'];
    await addHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Invalid format! Please use /add [amount] [description] [people]');
  });

  it('should return an error message if the group does not exist', async () => {
    prisma.group.findUnique.mockResolvedValue(null);
    const messageArray = ['/add', '10', 'lunch', '@user1'];
    await addHandler(messageArray, chatId, messageSender);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Cashshare Bot is not initialized for this group! Use /start to initialize.');
  });

  it('should create a new user if a user is not found', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId, members: [] });
    prisma.user.findUnique.mockResolvedValue(null);
    findUser_byUsername.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'newUser' });

    const messageArray = ['/add', '10', 'lunch', '@newUser'];
    await addHandler(messageArray, chatId, messageSender);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('should add the expense and update balances correctly', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId, members: [] });
    findUser_byUsername.mockResolvedValue({ id: 'user1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'user1' });
    prisma.userGroupBalance.findFirst.mockResolvedValue(null);
    prisma.userGroupBalance.findMany.mockResolvedValue([{ userId: 'user1', balance: 0 }]);

    const messageArray = ['/add', '10', 'lunch', '@user1'];
    await addHandler(messageArray, chatId, messageSender);

    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(prisma.userGroupBalance.update).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Added expense of $10 for lunch for @testuser, @user1!');
  });


  it('should handle multiple users correctly', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId, members: [] });
    findUser_byUsername.mockResolvedValueOnce({ id: 'user1' }).mockResolvedValueOnce({ id: 'user2' });
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'user1' }).mockResolvedValueOnce({ id: 'user2' });
    prisma.userGroupBalance.findFirst.mockResolvedValue(null);
    prisma.userGroupBalance.findMany.mockResolvedValue([{ userId: 'user1', balance: 0 }, { userId: 'user2', balance: 0 }]);

    const messageArray = ['/add', '20', 'dinner', '@user1', '@user2'];
    await addHandler(messageArray, chatId, messageSender);

    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(prisma.userGroupBalance.update).toHaveBeenCalledTimes(3);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Added expense of $20 for dinner for @testuser, @user1, @user2!');
  });

  // it('should handle database errors gracefully', async () => {
  //   prisma.group.findUnique.mockRejectedValue(new Error('Database error'));
  //   const messageArray = ['/add', '10', 'lunch', '@user1'];
  //   await addHandler(messageArray, chatId, messageSender);
  //   expect(sendMessage).toHaveBeenCalledWith(chatId, 'Error adding expense! Please try again.');
  // });
});