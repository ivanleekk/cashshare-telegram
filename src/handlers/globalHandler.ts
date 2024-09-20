// src/handlers/globalHandler.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendMessage } from "../utils/utils";

const prisma = new PrismaClient({});



const globalHandler = async (req: Request, res: Response) => {
    // check if the request body has a message object
    if (!req.body.message) {
        return res.send("No message object found in the request body");
    }
    const chatId = req.body.message.chat.id;
    const messageText = req.body.message.text;
    const chatTitle = req.body.message.chat.title;

    console.log(messageText);



    switch (messageText) {
        case "/start":
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

        case "/help":
            return sendMessage(chatId, res, "Available commands: \n/start - Initialize Cashshare Bot for the group \n/add - Add an expense \n/settle - Settle an expense \n/balance - Check the balance");

        case "/add":
            // format: /add <amount> <description> <people>
            const messageArray = messageText.split(" ");
            if (messageArray.length < 4) {
                return sendMessage(chatId, res, "Invalid format! Please use /add [amount] [description] [people]");
            }
            const amount = parseFloat(messageArray[1]);
            const description = messageArray[2];
            const people = messageArray.slice(3);
            // check if all people are valid, with @ prefix
            const peopleList = people.filter((person: string) => person.startsWith("@"));

            // if not all people are valid, return an error message
            if (peopleList.length !== people.length) {
                return sendMessage(chatId, res, "Invalid format! Please use @username for all users involved.");
            }
            break;
        default:
            return sendMessage(chatId, res, "Command not recognized. Please use /help to see the available commands.");
    }
    return;
};

export default globalHandler;