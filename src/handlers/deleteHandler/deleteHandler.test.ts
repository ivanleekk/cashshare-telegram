import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMessage } from "../../utils/telegramUtils";
import { deleteTransactions_byGroupTransactionId, findTransactions_byGroupTransactionId } from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";
import { deleteHandler } from "./deleteHandler";

// Mock the dependencies
vi.mock("../../utils/telegramUtils", () => ({
    sendMessage: vi.fn(),
}));

vi.mock("../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils", () => ({
    deleteTransactions_byGroupTransactionId: vi.fn(),
    findTransactions_byGroupTransactionId: vi.fn(),
}));

describe("deleteHandler", () => {
    const chatId = "chatId";

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should return an error message if transaction id is not provided", async () => {
        const messageArray = ["/delete"];

        await deleteHandler(messageArray, chatId);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "Please provide the transaction id to delete");
    });

    it("should return an error message if no transactions are found with the given id", async () => {
        const messageArray = ["/delete", "1"];
        (findTransactions_byGroupTransactionId as vi.Mock).mockResolvedValue([]);

        await deleteHandler(messageArray, chatId);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "No transactions found with the given id");
    });

    it("should delete the transaction and return a success message", async () => {
        const messageArray = ["/delete", "1"];
        const mockTransactions = [{ id: "1" }];
        (findTransactions_byGroupTransactionId as vi.Mock).mockResolvedValue(mockTransactions);

        await deleteHandler(messageArray, chatId);

        expect(deleteTransactions_byGroupTransactionId).toHaveBeenCalledWith(chatId, 1);
        expect(sendMessage).toHaveBeenCalledWith(chatId, "Transaction deleted successfully");
    });

    it("should return an error message if an error occurs", async () => {
        const messageArray = ["/delete", "1"];
        (findTransactions_byGroupTransactionId as vi.Mock).mockRejectedValue(new Error("Test error"));

        await deleteHandler(messageArray, chatId);

        expect(sendMessage).toHaveBeenCalledWith(chatId, "An error occurred: Test error");
    });
});