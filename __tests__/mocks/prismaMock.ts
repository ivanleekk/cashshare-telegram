// __mocks__/prismaMock.ts
import { vi } from 'vitest';

// Create the mock Prisma object structure
const mockPrisma = {
    group: {
        findUnique: vi.fn(), // Mock the `findUnique` function
    },
    transaction: {
        create: vi.fn(), // Mock the `create` function
    },
    userGroupBalance: {
        update: vi.fn(), // Mock the `update` function
    },
};

// Mock the PrismaClient constructor to return the mocked methods
const PrismaClient = vi.fn().mockImplementation(() => mockPrisma);

export { PrismaClient };
export default mockPrisma;
