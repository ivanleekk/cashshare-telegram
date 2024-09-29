import {prisma} from "../../../libs/prisma";
import {User} from "@prisma/client";

export async function findUserGroupBalance_byUserIdGroupId(user: User, chatId: string | number) {
    return prisma.userGroupBalance.findFirst({
        where: {
            userId: user.id,
            groupId: chatId.toString()
        }
    })
}

export async function createUserGroupBalance(user: User, chatId: string | number) {
    return prisma.userGroupBalance.create({
        data: {
            user: {
                connect: {
                    id: user.id
                }
            },
            group: {
                connect: {
                    id: chatId.toString()
                }
            }
        }
    })
}

export async function updateUserGroupBalance_byUserIdGroupId(user: User, chatId: string | number, amount: number) {
    // if userGroupBalance does not exist, create it
    const userGroupBalance = await findUserGroupBalance_byUserIdGroupId(user, chatId);
    if (!userGroupBalance) {
        await createUserGroupBalance(user, chatId);
    }
    return prisma.userGroupBalance.update({
        where: {
            userId_groupId: {
                userId: user.id,
                groupId: chatId.toString()
            }
        },
        data: {
            balance: {
                increment: amount
            }
        }
    })
}

export async function findUserGroupBalances_byGroupId(groupId: string | number) {
    return prisma.userGroupBalance.findMany({
        where: {
            groupId: groupId.toString()
        },
        include: {
            user: true
        }
    })
}