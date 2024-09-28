import {Response} from "express";
import {sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function transactionsHandler(chatId: string) {
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
        return sendMessage(chatId, "No transactions found!");
    }
    let message = "<b>Transactions:</b>\n";
    transactions.forEach(transaction => {
        const payers = transaction.payer.map(payer => payer.username.toString()).join(", ");
        const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
        message += `Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.amount} Description: ${transaction.description}\n\n`;
    });
    return sendMessage(chatId, message);
}

