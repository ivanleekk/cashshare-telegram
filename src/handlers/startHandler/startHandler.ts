import { Response } from "express";
import { sendMessage } from "../../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function startHandler(chatTitle: string, chatId: string) {
    try {
        if (chatTitle === undefined || chatTitle === null) {
            return sendMessage(chatId, "Cashshare Bot can only be initialized in a group chat!");
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
            return sendMessage(chatId, `Cashshare Bot is already initialized for <i>${chatTitle}</i>!`);
        }
        // add the chatId to database Group table
        await prisma.group.create({
            data: {
                id: chatId.toString(),
                name: chatTitle,
            }
        });

        return sendMessage(chatId, `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}