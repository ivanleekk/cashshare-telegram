import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startHandler } from './startHandler';
import { sendMessage } from '../../utils/telegramUtils';
import { PrismaClient } from '@prisma/client';

vi.mock('../../utils/utils', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    group: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('startHandler', () => {
  let prisma: any;
  let chatId: string;
  let chatTitle: string;

  beforeEach(() => {
    prisma = new PrismaClient();
    chatId = '1';
    chatTitle = 'Test Group';
    vi.clearAllMocks();
  });

  it('should return an error message if chatTitle is undefined', async () => {
    await startHandler(undefined, chatId);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Cashshare Bot can only be initialized in a group chat!');
  });

  it('should return an error message if chatTitle is null', async () => {
    await startHandler(null, chatId);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'Cashshare Bot can only be initialized in a group chat!');
  });

  it('should return a message if the group already exists', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: chatId, name: chatTitle });
    await startHandler(chatTitle, chatId);
    expect(sendMessage).toHaveBeenCalledWith(chatId, `Cashshare Bot is already initialized for <i>${chatTitle}</i>!`);
  });

  it('should create a new group and return a welcome message if the group does not exist', async () => {
    prisma.group.findUnique.mockResolvedValue(null);
    await startHandler(chatTitle, chatId);
    expect(prisma.group.create).toHaveBeenCalledWith({
      data: {
        id: chatId.toString(),
        name: chatTitle,
      },
    });
    expect(sendMessage).toHaveBeenCalledWith(chatId, `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`);
  });
});