import { Response } from "express";
import { findUser_byUsername, sendMessage } from "../../utils/utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({});

export async function payHandler(messageArray: string[], chatId: string, messageSender: String) {
    try {
        // format: /pay <amount> <payee>
        const group = await prisma.group.findUnique({
            where: {
                id: chatId.toString()
            }
        });
        if (!group) {
            return sendMessage(chatId, "Group not found!");
        }

        if (messageArray.length != 3) {
            return sendMessage(chatId, "Invalid format! Please use /pay [amount] [payee]");
        }
        const amount = parseFloat(messageArray[1]);
        const payee = await findUser_byUsername(messageArray[2]);
        if (!payee) {
            return sendMessage(chatId, "Payee not found!");
        }

        // add this as a transaction in the database
        const user = await findUser_byUsername(`@${messageSender}`);
        if (!user) {
            return sendMessage(chatId, "You are not part of this group!");
        }

        await prisma.transaction.create({
            data: {
                totalAmount: amount,
                description: `Payment from ${user.username} to ${payee.username}`,
                type: "REPAYMENT",
                group: {
                    connect: {
                        id: chatId.toString()
                    }
                },
                payee: {
                    connect: {
                        id: payee.id
                    }
                },
                payers: {
                    create: [
                        {
                            userId: user.id,
                            amount: amount
                        }
                    ]
                },
            }
        });

        // decrease the balance of the payer
        await prisma.userGroupBalance.update({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: chatId.toString()
                }
            },
            data: {
                balance: {
                    decrement: amount
                }
            }
        });

        // increase the balance of the payee
        await prisma.userGroupBalance.update({
            where: {
                userId_groupId: {
                    userId: payee.id,
                    groupId: chatId.toString()
                }
            },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
        return sendMessage(chatId, `Successfully paid ${amount} to ${messageArray[2]}`);
    } catch (error: any) {
        return sendMessage(chatId, `An error occurred: ${error.message}`);
    }
}