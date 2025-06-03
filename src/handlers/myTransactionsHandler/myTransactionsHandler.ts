import {sendMessage, sendMessage_withInlineKeyboard, updateMessage_withInlineKeyboard} from "../../utils/telegramUtils";
import {
    findTransactions_byGroupId,
    findTransactions_byGroupId_withLimit, findTransactions_byGroupIdbyUserId_withLimit, getNextTransactionId, getTransactionPage
} from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";
import { findUser_byUsername } from "../../utils/prisma/prismaUserUtils/prismaUserUtils";

export async function myTransactionsHandler(chatId: string, page: number | null, messageId: string | null, numberOfTransactions: number, messageSender: string) {
    try {
        // get all transactions for the group
        if (page == null) {
            page = await getTransactionPage(chatId, numberOfTransactions);
        }

        const user = await findUser_byUsername(`@${messageSender}`);
        const mytransactions = await findTransactions_byGroupIdbyUserId_withLimit(chatId, user!.id, numberOfTransactions, page);
        if (mytransactions.length === 0) {
            if (messageId != null) {
                return
            }
            return sendMessage(chatId, "No transactions found!");
        }
        let message = `<b>Transactions for: ${user?.username}</b>\n`;
        mytransactions.forEach(transaction => {
            const payers = transaction.payers.map(payer => payer.user.username.toString() + ` $${payer.amount.toFixed(2)}`).join(", ");
            const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
            message += `Id: ${transaction.groupTransactionId} Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.totalAmount} Description: ${transaction.description}\n\n`;
        });
        if (messageId) {
            return updateMessage_withInlineKeyboard(chatId, messageId, message, [ [{text: "◀️", callback_data: `@${messageSender}_myprev_${page}`}, {text: "▶️", callback_data: `@${messageSender}_mynext_${page}`}]]);
        }
       return sendMessage_withInlineKeyboard(chatId, message, [ [{text: "◀️", callback_data: `@${messageSender}_myprev_${page}`}, {text: "▶️", callback_data: `@${messageSender}_mynext_${page}`}]]);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}
