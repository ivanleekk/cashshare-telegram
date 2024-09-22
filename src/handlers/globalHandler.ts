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
    const messageArray = messageText.split(" ");
    const messageSender = req.body.message.from.username;

    console.log(messageText);
    console.log(messageArray);



    switch (messageArray[0]) {
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
            if (messageArray.length < 4) {
                return sendMessage(chatId, res, "Invalid format! Please use /add [amount] [description] [people]");
            }
            const amount = parseFloat(messageArray[1]);
            const description = messageArray[2];
            const people = messageArray.slice(3);
            // check if all people are valid, with @ prefix
            const peopleList = people.filter((person: string) => person.startsWith("@"));

            // add the message sender to the front of the people list
            peopleList.unshift(`@${messageSender}`);

            console.log(peopleList);
            // if not all people are valid, return an error message
            if (peopleList.length !== people.length + 1) {
                return sendMessage(chatId, res, "Invalid format! Please use @username for all users involved.");
            }

            // check if group exists in database
            const groupExists = await prisma.group.findUnique({
                where: {
                    id: chatId.toString()
                },
                include: {
                    members: true
                }
            });
            console.log(groupExists);

            // if group does not exist, return an error message
            if (!groupExists) {
                return sendMessage(chatId, res, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
            }
            // check if all users are part of the group
            const users = groupExists.members;

            // if not all users are part of the group, add them to the group
            for (const person of peopleList) {
                let user = await prisma.user.findUnique({
                    where: {
                        username: person
                    }
                });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            username: person,
                        }
                    });
                }
                users.push(user)
            }

            console.log(users.map((user) => ({ id: user.id, username: user.username })));
            await prisma.group.update({
                where: {
                    id: chatId.toString()
                },
                data: {
                    members: {
                        connect: users.map((user) => ({ id: user.id }))
                    }
                }
            });

            // add the transaction to the database
            // by default, the payee is the user who added the expense
            await prisma.transaction.create({
                data: {
                    amount: amount,
                    description: description,
                    group: {
                        connect: {
                            id: chatId.toString()
                        }
                    },
                    payee: {
                        connect: {
                            id: users[0].id
                        }
                    },
                    payer: {
                        connect: users.map((user) => ({ id: user.id }))
                    }
                }
            });

            return sendMessage(chatId, res, `Added expense of ${amount} for ${description} for ${peopleList.join(", ")}!`);

        case "/balance":
            // check if group exists in database
            const groupBalance = await prisma.group.findUnique({
                where: {
                    id: chatId.toString()
                },
                include: {
                    members: true
                }
            });
            console.log(groupBalance);

            // if group does not exist, return an error message
            if (!groupBalance) {
                return sendMessage(chatId, res, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
            }
            // get the transactions for the sender
            const sender = await prisma.user.findUnique({
                where: {
                    username: `@${messageSender}`
                }
            });
            console.log(sender);
            // if the sender is not part of the group, return an error message
            if (!sender) {
                return sendMessage(chatId, res, "You are not involved in any transactions in the group.");
            }

            // get the transactions for the sender
            const transactions = await prisma.transaction.findMany({
                where: {
                    group: {
                        id: chatId.toString()
                    },
                    payer: {
                        some: {
                            id: sender.id
                        }
                    }
                },
                include: {
                    payee: true,
                    payer: true
                }
            });
            console.log(transactions);

            // if the sender has no transactions, return a message
            if (transactions.length === 0) {
                return sendMessage(chatId, res, "You have no transactions in the group.");
            }

            // calculate the balance for the sender
            let balance = 0;
            for (const transaction of transactions) {
                balance += transaction.amount / transaction.payer.length;
            }
            return sendMessage(chatId, res, `Your balance in the group is ${balance.toFixed(2)}.`);

        default:
            return sendMessage(chatId, res, "Command not recognized. Please use /help to see the available commands.");
    }
};

export default globalHandler;