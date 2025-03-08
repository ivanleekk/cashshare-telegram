import {findUser_byUsername} from "../../utils/prisma/prismaUserUtils/prismaUserUtils";
import {sendMessage} from "../../utils/telegramUtils";
import {
    findUserGroupBalance_byUserIdGroupId
} from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import {
    getTotalExpenditure_byGroupIdUserId
} from "../../utils/prisma/prismaTransactionPayerUtils/prismaTransactionPayerUtils";

export async function myExpenditureHandler(chatId: string, messageSender: string) {
    try {
        const user = await findUser_byUsername(`@${messageSender}`);
        if (!user) {
            return sendMessage(chatId, "You are not part of this group!");
        }
        
        // TODO: Find the sum of all the expenses that the user has been involved in
        
        const expenditure = await getTotalExpenditure_byGroupIdUserId(chatId, user.id);
        
        const expenditureMessage = `You have spent \$${expenditure.toFixed(2)}`;
        return sendMessage(chatId, `${expenditureMessage}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}