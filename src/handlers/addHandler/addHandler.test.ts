import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMessage } from "../../utils/telegramUtils";
import { findUser_byUsername } from "../../utils/prisma/prismaUserUtils/prismaUserUtils";
import { findGroup_byId, updateGroup_byId_withNewMembers } from "../../utils/prisma/prismaGroupUtils/prismaGroupUtils";
import { createUserGroupBalance, findUserGroupBalance_byUserIdGroupId } from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import { createTransaction_Expense } from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";
import { addHandler } from "./addHandler";

// Mock the dependencies
vi.mock("../../utils/telegramUtils", () => ({
    sendMessage: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaUserUtils/prismaUserUtils", () => ({
    findUser_byUsername: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaGroupUtils/prismaGroupUtils", () => ({
    findGroup_byId: vi.fn(),
    updateGroup_byId_withNewMembers: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils", () => ({
    createUserGroupBalance: vi.fn(),
    findUserGroupBalance_byUserIdGroupId: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils", () => ({
    createTransaction_Expense: vi.fn(),
}));

describe("addHandler", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should return an error message for invalid format", async () => {
        const messageArray = ["/add"];
        const chatId = "chatId";
        const messageSender = "sender";

        await addHandler(messageArray, chatId, messageSender);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "Invalid format! Please use /add [amount] [description] [people]");
    });

    it("should return an error message for invalid amount", async () => {
        const messageArray = ["/add", "invalidAmount", "description", "@user"];
        const chatId = "chatId";
        const messageSender = "sender";

        await addHandler(messageArray, chatId, messageSender);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "Invalid amount! Please use /add [amount] [description] [people]");
    });

    it("should return an error message if group does not exist", async () => {
        const messageArray = ["/add", "100", "description", "@user"];
        const chatId = "chatId";
        const messageSender = "sender";

        (findGroup_byId as vi.Mock).mockResolvedValue(null);

        await addHandler(messageArray, chatId, messageSender);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
    });

    it("should create a new user group balance if not exists", async () => {
        const messageArray = ["/add", "100", "description", "@user"];
        const chatId = "chatId";
        const messageSender = "sender";

        const mockGroup = { id: "chatId", members: [{ id: "userId" }] };
        (findGroup_byId as vi.Mock).mockResolvedValue(mockGroup);
        (findUserGroupBalance_byUserIdGroupId as vi.Mock).mockResolvedValue(null);

        await addHandler(messageArray, chatId, messageSender);

        expect(createUserGroupBalance).toHaveBeenCalledWith({ id: "userId" }, "chatId");
    });

    it("should add a new expense transaction", async () => {
        const messageArray = ["/add", "100", "description", "@user"];
        const chatId = "chatId";
        const messageSender = "sender";

        const mockGroup = { id: "chatId", members: [{ id: "userId" }] };
        const mockUser = { id: "userId" };
        (findGroup_byId as vi.Mock).mockResolvedValue(mockGroup);
        (findUserGroupBalance_byUserIdGroupId as vi.Mock).mockResolvedValue({ userId: "userId", groupId: "chatId", balance: 0 });
        (findUser_byUsername as vi.Mock).mockResolvedValue(mockUser);

        await addHandler(messageArray, chatId, messageSender);

        expect(createTransaction_Expense).toHaveBeenCalled();
        expect(sendMessage).toHaveBeenCalledWith(chatId, `Added expense of \$100 for description for @sender, @user!`);
    });
});