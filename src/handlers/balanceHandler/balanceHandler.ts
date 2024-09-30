import { sendMessage } from "../../utils/telegramUtils";
import {findUser_byUsername} from "../../utils/prisma/prismaUserUtils/prismaUserUtils";
import {
    findUserGroupBalance_byUserIdGroupId,
    findUserGroupBalances_byGroupId
} from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import {findGroup_byId} from "../../utils/prisma/prismaGroupUtils/prismaGroupUtils";


export async function individualBalanceHandler(chatId: string, messageSender: string) {
    try {
        const user = await findUser_byUsername(`@${messageSender}`);
        if (!user) {
            return sendMessage(chatId, "You are not part of this group!");
        }

        const userBalance = await findUserGroupBalance_byUserIdGroupId(user, chatId);

        if (!userBalance) {
            return sendMessage(chatId, "You have no balance in this group!");
        }

        const balance = userBalance.balance;
        const balanceMessage = balance > 0
            ? `You owe \$${balance.toFixed(2)}`
            : `You are owed \$${Math.abs(balance).toFixed(2)}`;
        return sendMessage(chatId, `${balanceMessage}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}

export async function groupBalanceHandler(chatId: string) {
    try {
        const group = await findGroup_byId(chatId);

        if (group === null) {
            await sendMessage(chatId, "This group is not initialised! Use /start to continue.");
        }

        const groupBalances = await findUserGroupBalances_byGroupId(chatId);

        return sendMessage(chatId, `The group balance is \n${groupBalances.map((userGroupBalance) => 
    `${userGroupBalance.user.username} ${userGroupBalance.balance > 0 ? `owes \$${userGroupBalance.balance.toFixed(2)}` : `is owed \$${Math.abs(userGroupBalance.balance).toFixed(2)}`}`
).join("\n")}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}