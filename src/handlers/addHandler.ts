import {Response} from "express";
import {sendMessage} from "../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function addHandler(messageArray: string[], chatId: String, res: Response<any, any>, messageSender: String) {
    // format: /add <amount> <description> <people>
    if (messageArray.length < 4) {
        return sendMessage(chatId, res, "Invalid format! Please use /add [amount] [description] [people]");
    }
    const amount = parseFloat(messageArray[1]);
    const description = messageArray[2];
    const payers = messageArray.slice(3);
    // check if all people are valid, with @ prefix
    let payerList = payers.filter((person: string) => person.startsWith("@"));

    // add the message sender to the front of the people list
    payerList.unshift(`@${messageSender}`);

    // if not all people are valid, return an error message
    if (payerList.length !== payers.length + 1) {
        return sendMessage(chatId, res, "Invalid format! Please use @username for all users involved.");
    }

    // remove duplicates from the payer list
    payerList = [...new Set(payerList)];
    console.log(payerList);
    // check if group exists in database
    const group = await prisma.group.findUnique({
        where: {
            id: chatId.toString()
        },
        include: {
            members: true
        }
    });

    // if group does not exist, return an error message
    if (!group) {
        return sendMessage(chatId, res, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
    }
    // check if all users are part of the group
    const users = group.members;

    // if not all users are part of the group, add them to the group
    for (const person of payerList) {
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

    await prisma.group.update({
        where: {
            id: chatId.toString()
        },
        data: {
            members: {
                connect: users.map((user) => ({id: user.id}))
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
                connect: users.map((user) => ({id: user.id}))
            }
        }
    });

    return sendMessage(chatId, res, `Added expense of ${amount} for ${description} for ${payerList.join(", ")}!`);
}
