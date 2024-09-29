import { sendMessage } from "../../utils/telegramUtils";
import {findTransactions_byGroupId} from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";

export async function transactionsHandler(chatId: string) {
    try {
        // get all transactions for the group
        const transactions = await findTransactions_byGroupId(chatId);
        if (transactions.length === 0) {
            return sendMessage(chatId, "No transactions found!");
        }
        let message = "<b>Transactions:</b>\n";
        transactions.forEach(transaction => {
            console.log(transaction);
            const payers = transaction.payers.map(payer => payer.user.username.toString()).join(", ");
            const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
            message += `Id: ${transaction.groupTransactionId} Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.totalAmount} Description: ${transaction.description}\n\n`;
        });
        return sendMessage(chatId, message);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}