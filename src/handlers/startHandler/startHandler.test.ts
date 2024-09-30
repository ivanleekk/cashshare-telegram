import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startHandler } from './startHandler';
import { sendMessage } from '../../utils/telegramUtils';
import { createGroup, findGroup_byId } from '../../utils/prisma/prismaGroupUtils/prismaGroupUtils';

// Mock the dependencies
vi.mock('../../utils/telegramUtils', () => ({
    sendMessage: vi.fn(),
}));

vi.mock('../../utils/prisma/prismaGroupUtils/prismaGroupUtils', () => ({
    createGroup: vi.fn(),
    findGroup_byId: vi.fn(),
}));

describe('startHandler', () => {
    const chatId = '1';
    const chatTitle = 'Test Group';

    beforeEach(() => {
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
        (findGroup_byId as vi.Mock).mockResolvedValue({ id: chatId, name: chatTitle });
        await startHandler(chatTitle, chatId);
        expect(sendMessage).toHaveBeenCalledWith(chatId, `Cashshare Bot is already initialized for <i>${chatTitle}</i>!`);
    });

    it('should create a new group and return a welcome message if the group does not exist', async () => {
        (findGroup_byId as vi.Mock).mockResolvedValue(null);
        await startHandler(chatTitle, chatId);
        expect(createGroup).toHaveBeenCalledWith(chatId, chatTitle);
        expect(sendMessage).toHaveBeenCalledWith(chatId, `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`);
    });

    it('should return an error message if an error occurs', async () => {
        (findGroup_byId as vi.Mock).mockRejectedValue(new Error('Test error'));
        await startHandler(chatTitle, chatId);
        expect(sendMessage).toHaveBeenCalledWith(chatId, 'An error occurred: Test error');
    });
});