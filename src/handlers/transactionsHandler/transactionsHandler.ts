import { sendMessage } from "../../utils/telegramUtils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function transactionsHandler(chatId: string) {
    try {
        // get all transactions for the group
        const transactions = await prisma.transaction.findMany({
            where: {
                groupId: chatId.toString()
            },
            include: {
                payers: {
                    include: {
                        user: true
                    }
                },
                payee: true
            }
        });
        if (transactions.length === 0) {
            return sendMessage(chatId, "No transactions found!");
        }
        let message = "<b>Transactions:</b>\n";
        transactions.forEach(transaction => {
            console.log(transaction);
            const payers = transaction.payers.map(payer => payer.user.username.toString()).join(", ");
            const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
            message += `Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.totalAmount} Description: ${transaction.description}\n\n`;
        });
        return sendMessage(chatId, message);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}