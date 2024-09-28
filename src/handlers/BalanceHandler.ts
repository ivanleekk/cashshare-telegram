import { findUser_byUsername, sendMessage } from "../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function individualBalanceHandler(chatId: string, messageSender: string) {
    try {
        const user = await findUser_byUsername(`@${messageSender}`);
        if (!user) {
            return sendMessage(chatId, "You are not part of this group!");
        }
        const userBalance = await prisma.userGroupBalance.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: chatId.toString()
                }
            },
        });

        if (!userBalance) {
            return sendMessage(chatId, "You have no balance in this group!");
        }

        const balance = userBalance.balance;
        const balanceMessage = balance > 0
            ? `You owe \$${balance.toFixed(2)}`
            : `You are owed \$${Math.abs(balance).toFixed(2)}`;
        return sendMessage(chatId, `${balanceMessage}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}

export async function groupBalanceHandler(chatId: string) {
    try {
        const group = await prisma.group.findUnique({
            where: {
                id: chatId.toString()
            },
            include: {
                members: true
            }
        });

        if (!group) {
            return sendMessage(chatId, "Group not found!");
        }

        const groupMembers = group.members;

        const groupBalance = await Promise.all(groupMembers.map(async (member) => {
            const userBalance = await prisma.userGroupBalance.findUnique({
                where: {
                    userId_groupId: {
                        userId: member.id,
                        groupId: chatId.toString()
                    }
                }
            });
            const balance = userBalance ? userBalance.balance : 0;
            const balanceMessage = balance > 0
                ? `owes \$${balance.toFixed(2)}`
                : `is owed \$${Math.abs(balance).toFixed(2)}`;
            return { username: member.username, balanceMessage };
        }));

        return sendMessage(chatId, `The group balance is \n${groupBalance.map((user) => `${user.username} ${user.balanceMessage}`).join("\n")}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}