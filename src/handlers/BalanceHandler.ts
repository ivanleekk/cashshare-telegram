import {findUser_byUsername, sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";
import {Response} from "express";

const prisma = new PrismaClient({});

export async function individualBalanceHandler(chatId: string, messageSender: String) {
    // check if user exists in user group balance table
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

    // get the user's balance
    const balance = userBalance.balance;
    return sendMessage(chatId, `Your balance in this group is \$${balance.toFixed(2)}`);
}

export async function groupBalanceHandler(chatId: string) {
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

    // get the balance per user in the group
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
        if (!userBalance) {
            return { username: member.username, balance: 0 };
        }
        return { username: member.username, balance: userBalance.balance };
    }));

    return sendMessage(chatId, `The group balance is \n${groupBalance.map((user) => `${user.username}: \$${user.balance.toFixed(2)}`).join("\n")}`);
}