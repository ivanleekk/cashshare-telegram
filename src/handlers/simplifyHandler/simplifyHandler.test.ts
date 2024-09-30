import { describe, it, expect, beforeEach, vi } from 'vitest';
import { simplifyHandler } from './simplifyHandler';
import { findUserGroupBalances_byGroupId } from '../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils';
import { sendMessage } from '../../utils/telegramUtils';


vi.mock('../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils');
vi.mock('../../utils/telegramUtils');

const mockedFindUserGroupBalances_byGroupId = findUserGroupBalances_byGroupId as vi.MockedFunction<typeof findUserGroupBalances_byGroupId>;
const mockedSendMessage = sendMessage as vi.MockedFunction<typeof sendMessage>;

describe('simplifyHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send "No balances found" if balances are empty', async () => {
        mockedFindUserGroupBalances_byGroupId.mockResolvedValueOnce(null);

        await simplifyHandler('testChatId');

        expect(mockedSendMessage).toHaveBeenCalledWith('testChatId', 'No balances found');
    });

    it('should simplify balances and send messages', async () => {
        const balances = [
            { user: { username: '@user1' }, balance: -50 },
            { user: { username: '@user2' }, balance: 30 },
            { user: { username: '@user3' }, balance: 20 },
        ];
        mockedFindUserGroupBalances_byGroupId.mockResolvedValueOnce(balances);

        await simplifyHandler('testChatId');

        expect(mockedSendMessage).toHaveBeenCalledWith('testChatId', '@user2 pays @user1 $30');
        expect(mockedSendMessage).toHaveBeenCalledWith('testChatId', '@user3 pays @user1 $20');
        expect(mockedSendMessage).toHaveBeenCalledWith('testChatId', 'Simplified!');
    });
});