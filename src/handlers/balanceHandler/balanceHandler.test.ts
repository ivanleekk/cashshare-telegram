import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { individualBalanceHandler, groupBalanceHandler } from './balanceHandler';
import { sendMessage } from "../../utils/telegramUtils";
import { findUser_byUsername } from "../../utils/prisma/prismaUserUtils/prismaUserUtils";
import { findUserGroupBalance_byUserIdGroupId, findUserGroupBalances_byGroupId } from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import { findGroup_byId } from "../../utils/prisma/prismaGroupUtils/prismaGroupUtils";

// Mock the dependencies
vi.mock("../../utils/telegramUtils", () => ({
    sendMessage: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaUserUtils/prismaUserUtils", () => ({
    findUser_byUsername: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils", () => ({
    findUserGroupBalance_byUserIdGroupId: vi.fn(),
    findUserGroupBalances_byGroupId: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaGroupUtils/prismaGroupUtils", () => ({
    findGroup_byId: vi.fn(),
}));

describe("BalanceHandler", () => {
    const chatId = "chatId";
    const messageSender = "sender";

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("individualBalanceHandler", () => {
        it("should return an error message if the user is not part of the group", async () => {
            (findUser_byUsername as vi.Mock).mockResolvedValue(null);

            await individualBalanceHandler(chatId, messageSender);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "You are not part of this group!");
        });

        it("should return an error message if the user has no balance in the group", async () => {
            (findUser_byUsername as vi.Mock).mockResolvedValue({id: "userId"});
            (findUserGroupBalance_byUserIdGroupId as vi.Mock).mockResolvedValue(null);

            await individualBalanceHandler(chatId, messageSender);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "You have no balance in this group!");
        });

        it("should return the user's balance in the group indicating they owe money", async () => {
            (findUser_byUsername as vi.Mock).mockResolvedValue({id: "userId"});
            (findUserGroupBalance_byUserIdGroupId as vi.Mock).mockResolvedValue({balance: 100});

            await individualBalanceHandler(chatId, messageSender);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "You owe \$100.00");
        });

        it("should return the user's balance in the group indicating they are owed money", async () => {
            (findUser_byUsername as vi.Mock).mockResolvedValue({id: "userId"});
            (findUserGroupBalance_byUserIdGroupId as vi.Mock).mockResolvedValue({balance: -50});

            await individualBalanceHandler(chatId, messageSender);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "You are owed \$50.00");
        });
    });

    describe("groupBalanceHandler", () => {
        it("should return an error message if the group is not found", async () => {
            (findGroup_byId as vi.Mock).mockResolvedValue(null);

            await groupBalanceHandler(chatId);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "This group is not initialised! Use /start to continue.");
        });

        it("should return the group balance indicating members owe or are owed money", async () => {
            (findGroup_byId as vi.Mock).mockResolvedValue({
                id: chatId,
                members: [{id: "user1", username: "user1"}, {id: "user2", username: "user2"}],
            });
            (findUserGroupBalances_byGroupId as vi.Mock).mockResolvedValue([
                {user: {username: "user1"}, balance: 50},
                {user: {username: "user2"}, balance: -75},
            ]);

            await groupBalanceHandler(chatId);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "The group balance is \nuser1 owes \$50.00\nuser2 is owed \$75.00");
        });

        it("should handle members with no balance", async () => {
            (findGroup_byId as vi.Mock).mockResolvedValue({
                id: chatId,
                members: [{id: "user1", username: "user1"}, {id: "user2", username: "user2"}],
            });
            (findUserGroupBalances_byGroupId as vi.Mock).mockResolvedValue([
                {user: {username: "user1"}, balance: 0},
                {user: {username: "user2"}, balance: 75},
            ]);

            await groupBalanceHandler(chatId);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "The group balance is \nuser1 is owed \$0.00\nuser2 owes \$75.00");
        });

        it("should return a message if there are no balances in the group", async () => {
            (findGroup_byId as vi.Mock).mockResolvedValue({
                id: chatId,
                members: [{id: "user1", username: "user1"}, {id: "user2", username: "user2"}],
            });
            (findUserGroupBalances_byGroupId as vi.Mock).mockResolvedValue([]);

            await groupBalanceHandler(chatId);

            expect(sendMessage).toHaveBeenCalledWith(chatId, "There are no outstanding balances in the group");
        });
    });
});