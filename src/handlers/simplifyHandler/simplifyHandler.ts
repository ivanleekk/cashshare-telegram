import {findUserGroupBalances_byGroupId} from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import {sendMessage} from "../../utils/telegramUtils";

export async function simplifyHandler(chatId: string) {
    const balances = await findUserGroupBalances_byGroupId(chatId);
    // if balances is empty, return
    if (!balances) {
        return await sendMessage(chatId, "No balances found");
    }
    // sort balances by balance
    balances.sort((a, b) => a.balance - b.balance);

    // make as few transactions as possible to get everyone to 0
    // start with the person owed the most money
    let i = 0;
    let j = balances.length - 1;
    // starts with biggest debtor and biggest creditor, then changes to the next biggest debtor and creditor when
    // respective balance reaches 0
    while (i < j) {
        const creditor = balances[i];
        const debtor = balances[j];
        const amount = Math.min(-creditor.balance, debtor.balance);
        creditor.balance += amount;
        debtor.balance -= amount;
        // if the amount is 0, skip
        if (amount === 0) {
            j--;
            continue;
        }
        await sendMessage(chatId, `${debtor.user.username} pays ${creditor.user.username} \$${amount}`);
        if (creditor.balance === 0) {
            i++;
        }
        if (debtor.balance === 0) {
            j--;
        }
    }
    return await sendMessage(chatId, "Simplified!");
}