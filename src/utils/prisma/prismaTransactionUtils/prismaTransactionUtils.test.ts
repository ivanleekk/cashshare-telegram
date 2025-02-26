import { describe, it, expect, vi, afterEach } from 'vitest';
import { prismaMock } from "../../../../libs/__mocks__/prismaMock";
import { prisma } from "../../../../libs/prisma";
import { getNextTransactionId, createTransaction_Expense, createTransaction_Repayment, findTransaction_byId, findTransactions_byGroupId, findTransactions_byGroupTransactionId, deleteTransactions_byGroupTransactionId } from "./prismaTransactionUtils";
import {findUser_byUsername} from "../prismaUserUtils/prismaUserUtils";

// Mock the prisma client
vi.mock("../../../../libs/prisma", () => ({
    prisma: prismaMock,
}));

// Mock the prisma user utils
vi.mock("../prismaUserUtils/prismaUserUtils", () => ({
    findUser_byUsername: vi.fn(),
}));

// Mock the prisma group transaction utils
vi.mock("./prismaTransactionUtils", () => ({
    getNextTransactionId: vi.fn(),
    findTransactions_byGroupTransactionId: vi.fn(),
}));

describe("prismaTransactionUtils", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("createTransaction_Expense", () => {
        it("should create a new expense transaction", async () => {
            const mockTransaction = { id: "1", type: "EXPENSE" };
            prismaMock.transaction.findMany.mockResolvedValue([]);
            prismaMock.transaction.create.mockResolvedValue(mockTransaction);
            findUser_byUsername.mockResolvedValue({ id: "payer1" });
            getNextTransactionId.mockResolvedValue(1);

            const result = await (await vi.importActual("./prismaTransactionUtils")).createTransaction_Expense("chatId", { id: "payeeId" }, 100, "description", ["@payer1 50", "@payer2"], 25);
            expect(result).toEqual(mockTransaction);
            expect(prisma.transaction.create).toHaveBeenCalled();
        });
    });

    describe("createTransaction_Repayment", () => {
        it("should create a new repayment transaction", async () => {
            const mockTransaction = { id: "1", type: "REPAYMENT" };
            prismaMock.transaction.create.mockResolvedValue(mockTransaction);

            const result = await (await vi.importActual("./prismaTransactionUtils")).createTransaction_Repayment("chatId", { id: "payeeId" }, 100, "description", { id: "payerId" });
            expect(result).toEqual(mockTransaction);
            expect(prisma.transaction.create).toHaveBeenCalled();
        });
    });

    describe("findTransaction_byId", () => {
        it("should find a transaction by id", async () => {
            const mockTransaction = { id: "1" };
            prismaMock.transaction.findUnique.mockResolvedValue(mockTransaction);

            const result = await (await vi.importActual("./prismaTransactionUtils")).findTransaction_byId("1");
            expect(result).toEqual(mockTransaction);
            expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
                where: { id: "1" },
            });
        });
    });

    describe("findTransactions_byGroupId", () => {
        it("should find transactions by group id", async () => {
            const mockTransactions = [{ id: "1" }];
            prismaMock.transaction.findMany.mockResolvedValue(mockTransactions);

            const result = await (await vi.importActual("./prismaTransactionUtils")).findTransactions_byGroupId("chatId");
            expect(result).toEqual(mockTransactions);
            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                where: { groupId: "chatId", isDeleted: false },
                include: { payers: { include: { user: true } }, payee: true },
            });
        });
    });

    describe("findTransactions_byGroupTransactionId", () => {
        it("should find transactions by group transaction id", async () => {
            const mockTransactions = [{ id: "1" }];
            prismaMock.transaction.findMany.mockResolvedValue(mockTransactions);

            const result = await (await vi.importActual("./prismaTransactionUtils")).findTransactions_byGroupTransactionId("chatId", 1);
            expect(result).toEqual(mockTransactions);
            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                where: { groupId: "chatId", groupTransactionId: 1 },
                include: { payers: { include: { user: true } }, payee: true },
            });
        });
    });

    describe("deleteTransactions_byGroupTransactionId", () => {
        it("should delete transactions by group transaction id", async () => {
            const mockTransactions = [{ id: "1", payee: [{ id: "payeeId" }], payers: [{ user: { id: "payerId" } }], groupId: "chatId", groupTransactionId: 1  }];
            prismaMock.transaction.findMany.mockResolvedValue(mockTransactions);
    
            const result = await (await vi.importActual("./prismaTransactionUtils")).deleteTransactions_byGroupTransactionId("chatId", 1);
            expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
                where: { groupId: "chatId", groupTransactionId: 1 },
                data: { isDeleted: true },
            });
        });
    });
});