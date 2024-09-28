import { describe, it, expect, beforeEach, vi } from 'vitest';
import { transactionsHandler } from './transactionsHandler';
import { sendMessage } from '../utils/utils';
import { PrismaClient } from '@prisma/client';

vi.mock('../utils/utils', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    transaction: {
      findMany: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('transactionsHandler', () => {
  let prisma: any;
  let chatId: string;

  beforeEach(() => {
    prisma = new PrismaClient();
    chatId = '1';
    vi.clearAllMocks();
  });

  it('should return a message if no transactions are found', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    await transactionsHandler(chatId);
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'No transactions found!');
  });

  it('should return a message with all transactions', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        type: 'REPAYMENT',
        payer: [{ username: 'user1' }],
        payee: [{ username: 'user2' }],
        amount: 10,
        description: 'Lunch',
      },
      {
        type: 'EXPENSE',
        payer: [{ username: 'user3' }],
        payee: [{ username: 'user4' }],
        amount: 20,
        description: 'Dinner',
      },
    ]);

    await transactionsHandler(chatId);
    expect(sendMessage).toHaveBeenCalledWith(
      chatId,
      '<b>Transactions:</b>\nType: REPAYMENT \nFrom: user1 To: user2 \nAmount: $10 Description: Lunch\n\nType: EXPENSE \nFrom: user3 To: user4 \nAmount: $20 Description: Dinner\n\n'
    );
  });
});