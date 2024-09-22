import {sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";
import {Response} from "express";

const prisma = new PrismaClient({});

export async function balanceHandler(chatId: String, res: Response<any, any>, messageSender: String) {
    // check if group exists in database
    const group = await prisma.group.findUnique({
        where: {
            id: chatId.toString()
        },
        include: {
            members: true
        }
    });

    // if group does not exist, return an error message
    if (!group) {
        return sendMessage(chatId, res, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
    }
    // get the transactions for the sender
    const sender = await prisma.user.findUnique({
        where: {
            username: `@${messageSender}`
        }
    });

    // if the sender is not part of the group, return an error message
    if (!sender) {
        return sendMessage(chatId, res, "You are not involved in any transactions in the group.");
    }

    // get the transactions for the sender
    const transactions = await prisma.transaction.findMany({
        where: {
            group: {
                id: chatId.toString()
            },
            payer: {
                some: {
                    id: sender.id
                }
            }
        },
        include: {
            payee: true,
            payer: true
        }
    });

    // if the sender has no transactions, return a message
    if (transactions.length === 0) {
        return sendMessage(chatId, res, "You have no transactions in the group.");
    }

    // calculate the balance for the sender
    let balance = 0;
    for (const transaction of transactions) {
        balance += transaction.amount / transaction.payer.length;
    }
    return sendMessage(chatId, res, `Your balance in the group is ${balance.toFixed(2)}.`);
}
