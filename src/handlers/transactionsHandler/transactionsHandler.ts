import {sendMessage, sendMessage_withInlineKeyboard, updateMessage_withInlineKeyboard} from "../../utils/telegramUtils";
import {
    findTransactions_byGroupId,
    findTransactions_byGroupId_withLimit, getNextTransactionId, getTransactionPage
} from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";

export async function transactionsHandler(chatId: string, page: number | null, messageId: string | null, numberOfTransactions: number) {
    try {
        // get all transactions for the group
        if (page == null) {
            page = await getTransactionPage(chatId, numberOfTransactions);
        }
        const transactions = await findTransactions_byGroupId_withLimit(chatId,numberOfTransactions, page);
        if (transactions.length === 0) {
            if (messageId != null) {
                return
            }
            return sendMessage(chatId, "No transactions found!");
        }
        let message = "<b>Transactions:</b>\n";
        transactions.forEach(transaction => {
            const payers = transaction.payers.map(payer => payer.user.username.toString() + ` $${payer.amount}`).join(", ");
            const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
            message += `Id: ${transaction.groupTransactionId} Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.totalAmount} Description: ${transaction.description}\n\n`;
        });
        if (messageId) {
            return updateMessage_withInlineKeyboard(chatId, messageId, message, [ [{text: "◀️", callback_data: `prev_${page}`}, {text: "▶️", callback_data: `next_${page}`}]]);
        }
       return sendMessage_withInlineKeyboard(chatId, message, [ [{text: "◀️", callback_data: `prev_${page}`}, {text: "▶️", callback_data: `next_${page}`}]]);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}

// export async function transactionsHandler(chatId: string) {
//     try {
//         // get all transactions for the group
//         const transactions = await findTransactions_byGroupId(chatId);
//         if (transactions.length === 0) {
//             return sendMessage(chatId, "No transactions found!");
//         }
//         let message = "<b>Transactions:</b>\n";
//         transactions.forEach(transaction => {
//             console.log(transaction);
//             const payers = transaction.payers.map(payer => payer.user.username.toString()).join(", ");
//             const payees = transaction.payee.map(payee => payee.username.toString()).join(", ");
//             message += `Id: ${transaction.groupTransactionId} Type: ${transaction.type} \nFrom: ${payers} To: ${payees} \nAmount: \$${transaction.totalAmount} Description: ${transaction.description}\n\n`;
//         });
//         return sendMessage(chatId, message);
//     } catch (error: any) {
//         return sendMessage(chatId, `An error occurred: ${error.message}`);
//     }
// }