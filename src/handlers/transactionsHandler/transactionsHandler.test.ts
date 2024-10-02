import { describe, it, expect, beforeEach, vi } from 'vitest';
import { transactionsHandler } from './transactionsHandler';
import { sendMessage } from '../../utils/telegramUtils';
import { PrismaClient } from '@prisma/client';

vi.mock('../../utils/telegramUtils', () => ({
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
      groupTransactionId: 1,
      type: 'REPAYMENT',
      payers: [{ user: { username: 'user1' } }],
      payee: [{ username: 'user2' }],
      totalAmount: 10,
      description: 'Lunch',
    },
    {
      groupTransactionId: 2,
      type: 'EXPENSE',
      payers: [{ user: { username: 'user3' } }],
      payee: [{ username: 'user4' }],
      totalAmount: 20,
      description: 'Dinner',
    },
  ]);

  await transactionsHandler(chatId);
  expect(sendMessage).toHaveBeenCalledWith(
    chatId,
    '<b>Transactions:</b>\nId: 1 Type: REPAYMENT \nFrom: user1 To: user2 \nAmount: $10 Description: Lunch\n\nId: 2 Type: EXPENSE \nFrom: user3 To: user4 \nAmount: $20 Description: Dinner\n\n'
  );
});
});