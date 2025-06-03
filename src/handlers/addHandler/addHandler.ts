import {sendMessage} from "../../utils/telegramUtils";
import {findUser_byUsername} from "../../utils/prisma/prismaUserUtils/prismaUserUtils";
import {findGroup_byId, updateGroup_byId_withNewMembers} from "../../utils/prisma/prismaGroupUtils/prismaGroupUtils";
import {
    createUserGroupBalance,
    findUserGroupBalance_byUserIdGroupId, updateUserGroupBalance_byUserIdGroupId
} from "../../utils/prisma/prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import {createTransaction_Expense} from "../../utils/prisma/prismaTransactionUtils/prismaTransactionUtils";

export async function addHandler(messageArray: string[], chatId: string, messageSender: String) {
    try {
        // format: /add <amount> <description> <people>
        if (messageArray.length < 4) {
            return sendMessage(chatId, "Invalid format! Please use /add [amount] [description] [people]");
        }
        const amount = parseFloat(messageArray[1]);
        if (isNaN(amount)) {
            return sendMessage(chatId, "Invalid amount! Please use /add [amount] [description] [people]");
        }
        // find the index with @ prefix
        const firstUser: number = messageArray.findIndex((element: string) => element.startsWith("@"));
        const description = messageArray.slice(2, firstUser).join(" ").trim();
        const payers = messageArray.slice(firstUser);
        const payersUsernames = payers.filter((person: string) => person.startsWith("@"));

        // combine any payers are numbers to the payer before them
        for (let i = 0; i < payers.length; i++) {
            if (!payers[i].startsWith("@") && i > 0) {
                // if payer does not start with @ and this is not the first index, combine with the payer before
                // check if payers[i] is a number
                if (isNaN(parseFloat(payers[i]))) {
                    return sendMessage(chatId, "Invalid format! Please use /add [amount] [description] [people]");
                }
                payers[i - 1] += " " + payers[i];
                payers.splice(i, 1); // remove the number
                i--;
            }
        }

        // check if all people are valid, with @ prefix
        let payerList = payers.filter((person: string) => person.startsWith("@"));

        // add the message sender to the front of the people list if not already there
        if (!messageArray.includes(`@${messageSender}`)) {
            payerList.unshift(`@${messageSender}`);
        }

        // same thing but for payersUsernames
        if (!messageArray.includes(`@${messageSender}`)) {
            payersUsernames.unshift(`@${messageSender}`);
        }

         // check if the usernames are valid after @
        for (const person of payerList) {
            if (!person.startsWith("@") || person.length < 2) {
                return sendMessage(chatId, "Invalid format! One or more usernames are invalid. Please use /add [amount] [description] [people]");
            }
        }
        
        // trim whitespace from usernames
        payerList = payerList.map((person: string) => person.trim());

        // remove duplicates from the payer list
        payerList = [...new Set(payerList)];

        // check if group exists in database
        let group = await findGroup_byId(chatId);

        // if group does not exist, return an error message
        if (!group) {
            return sendMessage(chatId, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
        }

        // check if users are in the group, or else create them or add them to the list
        await updateGroup_byId_withNewMembers(chatId, payersUsernames);

        group = await findGroup_byId(chatId);

        // if not all users are in the UserGroupBalance table, add them
        if (group === null || group.members.length === 0) {
            throw new Error("No members in group!");
        }
        for (const user of group.members) {
            const userGroupBalance = await findUserGroupBalance_byUserIdGroupId(user, chatId);
            if (!userGroupBalance) {
                await createUserGroupBalance(user, chatId);
            }
        }


        // add the transaction to the database
        // by default, the payee is the user who added the expense
        const payee = await findUser_byUsername(`@${messageSender}`);
        if (!payee) {
            return sendMessage(chatId, "Error adding expense! Please try again.");
        }

        // get the amount per person who does not have a specific amount
        let specifiedAmount = 0;
        // split the payerList into two lists: one with amounts and one without
        const payerListWithoutAmount = [];
        const payerListWithAmount = [];
        for (const person of payerList) {
            if (person.includes(" ")) {
                // if the person has an amount specified it will be in the format "@username amount"
                payerListWithAmount.push(person);
                specifiedAmount += parseFloat(person.split(" ")[1]);
            } else {
                payerListWithoutAmount.push(person);
            }
        }

        // add the expense to the UserGroupBalance table for each user without amount
        let defaultAmountPerPerson = 0;
        if (payerListWithoutAmount.length > 0) {
            defaultAmountPerPerson = (amount - specifiedAmount) / payerListWithoutAmount.length;
        }

        await createTransaction_Expense(chatId, payee, amount, description, payerList, defaultAmountPerPerson);

        return sendMessage(chatId, `Added expense of \$${amount} for ${description} for ${payersUsernames.join(", ")}!`);
    } catch (error: any) {
        throw new Error(`An error occurred: ${error.message}`);
    }
}