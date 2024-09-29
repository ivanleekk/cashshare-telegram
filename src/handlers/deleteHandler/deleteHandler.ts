import {sendMessage} from "../../utils/telegramUtils";
import {
    deleteTransactions_byGroupTransactionId,
    findTransactions_byGroupTransactionId
} from "../../utils/prisma/prismaTransactionUtils";

export async function deleteHandler(messageArray: string[], chatId: string) {
    // delete transaction
    if (messageArray.length < 2) {
        return sendMessage(chatId, "Please provide the transaction id to delete");
    }
    const transactionId = Number(messageArray[1]);
    const transactions = await findTransactions_byGroupTransactionId(chatId, transactionId);
    if (transactions.length === 0) {
        return sendMessage(chatId, "No transactions found with the given id");
    }
    await deleteTransactions_byGroupTransactionId(chatId, transactionId);
    return sendMessage(chatId, "Transaction deleted successfully");
}