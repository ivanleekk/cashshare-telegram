import { sendMessage } from "../../utils/telegramUtils";
import {findUser_byUsername} from "../../utils/prisma/prismaUserUtils";
import {findGroup_byId} from "../../utils/prisma/prismaGroupUtils";
import {createTransaction_Repayment} from "../../utils/prisma/prismaTransactionUtils";

export async function payHandler(messageArray: string[], chatId: string, messageSender: String) {
    try {
        // format: /pay <amount> <payee>

        const group = await findGroup_byId(chatId);
        if (!group) {
            return sendMessage(chatId, "Group not found!");
        }

        if (messageArray.length != 3) {
            return sendMessage(chatId, "Invalid format! Please use /pay [total amount] [payee]");
        }
        const amount = parseFloat(messageArray[1]);
        const payee = await findUser_byUsername(messageArray[2]);
        if (!payee) {
            return sendMessage(chatId, "Payee not found!");
        }

        // add this as a transaction in the database
        const user = await findUser_byUsername(`@${messageSender}`);
        if (!user) {
            return sendMessage(chatId, "You are not part of this group!");
        }

        await createTransaction_Repayment(chatId, payee, amount, `Payment from ${user.username} to ${payee.username}`, user);

        return sendMessage(chatId, `Successfully paid \$${amount} to ${messageArray[2]}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}