import {findUser_byUsername, sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";
import {Response} from "express";

const prisma = new PrismaClient({});

export async function balanceHandler(chatId: String, res: Response<any, any>, messageSender: String) {
    // check if user exists in user group balance table
    const user = await findUser_byUsername(`@${messageSender}`);
    if (!user) {
        return sendMessage(chatId, res, "You are not part of this group!");
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
        return sendMessage(chatId, res, "You have no balance in this group!");
    }

    // get the user's balance
    const balance = userBalance.balance;
    return sendMessage(chatId, res, `Your balance in this group is \$${balance}`);
}
