import { sendMessage } from "../../utils/telegramUtils";
import {createGroup, findGroup_byId} from "../../utils/prisma/prismaGroupUtils/prismaGroupUtils";

export async function startHandler(chatTitle: string, chatId: string) {
    try {
        if (chatTitle === undefined || chatTitle === null) {
            return sendMessage(chatId, "Cashshare Bot can only be initialized in a group chat!");
        }
        // check if group exists in database
        const group = await findGroup_byId(chatId);

        // if group exists, return a message to the user
        if (group) {
            return sendMessage(chatId, `Cashshare Bot is already initialized for <i>${chatTitle}</i>!`);
        }
        // add the chatId to database Group table
        await createGroup(chatId, chatTitle);

        return sendMessage(chatId, `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}