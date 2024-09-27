// src/handlers/globalHandler.ts
import { Request, Response } from "express";
import { sendMessage } from "../utils/utils";
import {startHandler} from "./startHandler";
import {addHandler} from "./addHandler";
import {groupBalanceHandler, individualBalanceHandler} from "./BalanceHandler";
import {payHandler} from "./payHandler";
import {transactionsHandler} from "./transactionsHandler";

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

    switch (messageArray[0]) {
        case "/start":
            return await startHandler(chatTitle, chatId, res);

        case "/help":
            return sendMessage(chatId, res, "Available commands: \n" +
                "/start - Initialize Cashshare Bot for the group \n" +
                "/add - Add an expense \n" +
                "/pay - Pay back your friends \n" +
                "/balance - Check the balance\n" +
                "/groupbalance - Check the group balance\n" +
                "/transactions - Check the transactions\n");

        case "/add":
            return await addHandler(messageArray, chatId, res, messageSender);

        case "/balance":
            return await individualBalanceHandler(chatId, res, messageSender);

        case "/groupbalance":
            return await groupBalanceHandler(chatId, res);

        case "/pay":
            return await payHandler(messageArray, chatId, res, messageSender);

        case "/transactions":
            return await transactionsHandler(chatId, res);

        default:
            return sendMessage(chatId, res, "Command not recognized. Please use /help to see the available commands.");
    }

};

export default globalHandler;