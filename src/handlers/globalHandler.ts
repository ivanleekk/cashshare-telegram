// src/handlers/globalHandler.ts
import { Request, Response } from "express";
import { sendMessage } from "../utils/utils";
import {startHandler} from "./startHandler";
import {addHandler} from "./addHandler";
import {balanceHandler} from "./balanceHandler";

const globalHandler = async (req: Request, res: Response) => {
    // check if the request body has a message object
    if (!req.body.message) {
        return res.send("No message object found in the request body");
    }
    const chatId = req.body.message.chat.id;
    const messageText = req.body.message.text;
    const chatTitle = req.body.message.chat.title;
    const messageArray = messageText.split(" ");
    const messageSender = req.body.message.from.username;

    console.log(messageText);
    console.log(messageArray);

    switch (messageArray[0]) {
        case "/start":
            return await startHandler(chatTitle, chatId, res);

        case "/help":
            return sendMessage(chatId, res, "Available commands: \n/start - Initialize Cashshare Bot for the group \n/add - Add an expense \n/settle - Settle an expense \n/balance - Check the balance");

        case "/add":
            return await addHandler(messageArray, chatId, res, messageSender);

        case "/balance":
            return await balanceHandler(chatId, res, messageSender);

        default:
            return sendMessage(chatId, res, "Command not recognized. Please use /help to see the available commands.");
    }

};

export default globalHandler;