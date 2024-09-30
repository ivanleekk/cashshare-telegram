import { describe, it, expect, vi, afterEach } from 'vitest';
import { prismaMock } from "../../../../libs/__mocks__/prismaMock";
import { prisma } from "../../../../libs/prisma";
import { findUserGroupBalance_byUserIdGroupId, createUserGroupBalance, updateUserGroupBalance_byUserIdGroupId, findUserGroupBalances_byGroupId } from "./prismaUserGroupBalanceUtils";

// Mock the prisma client
vi.mock("../../../../libs/prisma", () => ({
    prisma: prismaMock,
}));

describe("prismaUserGroupBalanceUtils", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("findUserGroupBalance_byUserIdGroupId", () => {
        it("should find a user group balance by user id and group id", async () => {
            const mockBalance = { userId: "1", groupId: "1", balance: 100 };
            prismaMock.userGroupBalance.findFirst.mockResolvedValue(mockBalance);

            const result = await findUserGroupBalance_byUserIdGroupId({ id: "1" }, "1");
            expect(result).toEqual(mockBalance);
            expect(prisma.userGroupBalance.findFirst).toHaveBeenCalledWith({
                where: {
                    userId: "1",
                    groupId: "1"
                }
            });
        });
    });

    describe("createUserGroupBalance", () => {
        it("should create a new user group balance", async () => {
            const mockBalance = { userId: "1", groupId: "1", balance: 0 };
            prismaMock.userGroupBalance.create.mockResolvedValue(mockBalance);

            const result = await createUserGroupBalance({ id: "1" }, "1");
            expect(result).toEqual(mockBalance);
            expect(prisma.userGroupBalance.create).toHaveBeenCalledWith({
                data: {
                    user: {
                        connect: {
                            id: "1"
                        }
                    },
                    group: {
                        connect: {
                            id: "1"
                        }
                    }
                }
            });
        });
    });

    describe("updateUserGroupBalance_byUserIdGroupId", () => {
        it("should update a user group balance by user id and group id", async () => {
            const mockBalance = { userId: "1", groupId: "1", balance: 100 };
            prismaMock.userGroupBalance.findFirst.mockResolvedValue(mockBalance);
            prismaMock.userGroupBalance.update.mockResolvedValue({ ...mockBalance, balance: 200 });

            const result = await updateUserGroupBalance_byUserIdGroupId({ id: "1" }, "1", 100);
            expect(result).toEqual({ ...mockBalance, balance: 200 });
            expect(prisma.userGroupBalance.update).toHaveBeenCalledWith({
                where: {
                    userId_groupId: {
                        userId: "1",
                        groupId: "1"
                    }
                },
                data: {
                    balance: {
                        increment: 100
                    }
                }
            });
        });
    });

    describe("findUserGroupBalances_byGroupId", () => {
        it("should find user group balances by group id", async () => {
            const mockBalances = [{ userId: "1", groupId: "1", balance: 100 }];
            prismaMock.userGroupBalance.findMany.mockResolvedValue(mockBalances);

            const result = await findUserGroupBalances_byGroupId("1");
            expect(result).toEqual(mockBalances);
            expect(prisma.userGroupBalance.findMany).toHaveBeenCalledWith({
                where: {
                    groupId: "1"
                },
                include: {
                    user: true
                }
            });
        });
    });
});