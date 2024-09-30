import { vi } from 'vitest';

export const prismaMock = {
    transaction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    group: {
        findUnique: vi.fn(),
    },
    userGroupBalance: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    transactionPayer: {
        create: vi.fn(),
    }
};