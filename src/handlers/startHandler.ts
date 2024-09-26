import {Response} from "express";
import {sendMessage} from "../utils/utils";
import prisma from "../../libs/prisma";


export async function startHandler(chatTitle: string, chatId: string, res: Response<any,any>) {
    if (chatTitle === undefined || chatTitle === null) {
        return sendMessage(chatId, res, "Cashshare Bot can only be initialized in a group chat!");
    }
    // check if group exists in database
    const group = await prisma.group.findUnique({
        where: {
            id: chatId.toString()
        }
    });
    console.log(group);

    // if group exists, return a message to the user
    if (group) {
        return sendMessage(chatId, res, `Cashshare Bot is already initialized for <i>${chatTitle}</i>!`);
    }
    // add the chatId to database Group table
    await prisma.group.create({
        data: {
            id: chatId.toString(),
            name: chatTitle,
        }
    });

    return sendMessage(chatId, res, `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`);
}