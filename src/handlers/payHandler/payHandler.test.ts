import { describe, it, expect, beforeEach, vi } from 'vitest';
import { payHandler } from './payHandler';
import { sendMessage } from '../../utils/telegramUtils';
import { findUser_byUsername } from '../../utils/prisma/prismaUserUtils/prismaUserUtils';
import { findGroup_byId } from '../../utils/prisma/prismaGroupUtils/prismaGroupUtils';
import { createTransaction_Repayment } from '../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils';

// Mock the dependencies
vi.mock('../../utils/telegramUtils', () => ({
    sendMessage: vi.fn(),
}));

vi.mock('../../utils/prisma/prismaUserUtils/prismaUserUtils', () => ({
    findUser_byUsername: vi.fn(),
}));

vi.mock('../../utils/prisma/prismaGroupUtils/prismaGroupUtils', () => ({
    findGroup_byId: vi.fn(),
}));

vi.mock('../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils', () => ({
    createTransaction_Repayment: vi.fn(),
}));

describe('payHandler', () => {
    const chatId = 'chatId';
    const messageSender = 'sender';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return an error message if the group is not found', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue(null);
        const messageArray = ['/pay', '10', '@user1'];
        await payHandler(messageArray, chatId, messageSender);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'Group not found!');
    });

    it('should return an error message if the format is invalid', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue({ id: chatId });
        const messageArray = ['/pay', '10'];
        await payHandler(messageArray, chatId, messageSender);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'Invalid format! Please use /pay [total amount] [payee]');
    });

    it('should return an error message if the payee is not found', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue({ id: chatId });
        (findUser_byUsername as vi.Mock).mockResolvedValue(null);
        const messageArray = ['/pay', '10', '@user1'];
        await payHandler(messageArray, chatId, messageSender);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'Payee not found!');
    });

    it('should return an error message if the user is not part of the group', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue({ id: chatId });
        (findUser_byUsername as vi.Mock).mockResolvedValueOnce({ id: 'user1' }).mockResolvedValueOnce(null);
        const messageArray = ['/pay', '10', '@user1'];
        await payHandler(messageArray, chatId, messageSender);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'You are not part of this group!');
    });

    it('should create a transaction and update balances correctly', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue({ id: chatId });
        (findUser_byUsername as vi.Mock).mockResolvedValueOnce({ id: 'user2', username: 'user2' }).mockResolvedValueOnce({ id: 'user1', username: 'user1' });
        const messageArray = ['/pay', '10', '@user2'];
        await payHandler(messageArray, chatId, messageSender);

        expect(createTransaction_Repayment).toHaveBeenCalledWith(chatId, { id: 'user2', username: 'user2' }, 10, 'Payment from user1 to user2', { id: 'user1', username: 'user1' });
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'Successfully paid \$10 to @user2');
    });

    it('should return an error message if an error occurs', async () => {
        (findGroup_byId as vi.Mock).mockRejectedValue(new Error('Test error'));
        const messageArray = ['/pay', '10', '@user1'];
        await payHandler(messageArray, chatId, messageSender);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'An error occurred: Test error');
    });
});