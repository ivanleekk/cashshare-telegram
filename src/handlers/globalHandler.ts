// src/handlers/globalHandler.ts
import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

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
                return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
                    chat_id: chatId,
                    text: `Cashshare Bot cannot be initialized for this chat!`,
                    parse_mode:'HTML'
                })
                    .then((response) => {
                        res.send(response.data);
                    })
                    .catch((error) => {
                        res.send(error);
            });
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
                return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
                    chat_id: chatId,
                    text: `Cashshare Bot already initialized for <i>${chatTitle}</i>!`,
                    parse_mode:'HTML'
                })
                    .then((response) => {
                        res.send(response.data);
                    })
                    .catch((error) => {
                        res.send(error);
                    });
            }

            // add the chatId to database Group table
            await prisma.group.create({
                data: {
                    id: chatId.toString(),
                    name: chatTitle,
                }
            });

            return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
                chat_id: chatId,
                text: `Welcome to Cashshare Bot! Initialised Cashshare for <i>${chatTitle}</i>!`,
                parse_mode:'HTML'
            })
                .then((response) => {
                    res.send(response.data);
                })
                .catch((error) => {
                    res.send(error);
                });
            break;
        case "/help":
            return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
                chat_id: chatId,
                text: "Here are the available commands: /start, /help"
            })
                .then((response) => {
                    res.send(response.data);
                })
                .catch((error) => {
                    res.send(error);
                });
            break;
        default:
            return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
                chat_id: chatId,
                text: "Command not recognized. Please use /help to see the available commands."
            })
                .then((response) => {
                    res.send(response.data);
                })
                .catch((error) => {
                    res.send(error);
                });
            break;
    }
    return;
};

export default globalHandler;