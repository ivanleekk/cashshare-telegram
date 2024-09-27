import {Response} from "express";
import {sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function transactionsHandler(chatId: string, res: Response<any,any>) {
    // get all transactions for the group
    const transactions = await prisma.transaction.findMany({
        where: {
            groupId: chatId.toString()
        },
        include: {
            payer: true,
            payee: true
        }
    });
    if (transactions.length === 0) {
        return sendMessage(chatId, res, "No transactions found!");
    }
    let message = "<b>Transactions:</b>\n";
    transactions.forEach(transaction => {
        const payers = transaction.payer.map(payer => payer.username.toString()).join(", ");
        const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
        message += `From: ${payers} To: ${payees} Amount: ${transaction.amount} Description: ${transaction.description}\n`;
    });
    return sendMessage(chatId, res, message);
}

