import { describe, it, expect, vi, afterEach } from 'vitest';
import { prisma } from "../../../../libs/prisma";
import { findGroup_byId, updateGroup_byId_withNewMembers, createGroup } from "./prismaGroupUtils";

// Mock the prisma client
vi.mock("../../../libs/prisma", () => ({
    prisma: {
        group: {
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
    },
}));

describe("prismaGroupUtils", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("findGroup_byId", () => {
        it("should find a group by id", async () => {
            const mockGroup = { id: "123", members: [] };
            (prisma.group.findUnique as vi.Mock).mockResolvedValue(mockGroup);

            const result = await findGroup_byId("123");
            expect(result).toEqual(mockGroup);
            expect(prisma.group.findUnique).toHaveBeenCalledWith({
                where: { id: "123" },
                include: { members: true },
            });
        });
    });

    describe("updateGroup_byId_withNewMembers", () => {
        it("should update a group with new members", async () => {
            const mockGroup = { id: "123", members: [{ username: "newUser" }] };
            (prisma.group.update as vi.Mock).mockResolvedValue(mockGroup);

            const result = await updateGroup_byId_withNewMembers("123", ["newUser"]);
            expect(result).toEqual(mockGroup);
            expect(prisma.group.update).toHaveBeenCalledWith({
                where: { id: "123" },
                data: {
                    members: {
                        connectOrCreate: [
                            {
                                where: { username: "newUser" },
                                create: { username: "newUser" },
                            },
                        ],
                    },
                },
            });
        });
    });

    describe("createGroup", () => {
        it("should create a new group", async () => {
            const mockGroup = { id: "123", name: "Test Group" };
            (prisma.group.create as vi.Mock).mockResolvedValue(mockGroup);

            const result = await createGroup("123", "Test Group");
            expect(result).toEqual(mockGroup);
            expect(prisma.group.create).toHaveBeenCalledWith({
                data: {
                    id: "123",
                    name: "Test Group",
                },
            });
        });
    });
});