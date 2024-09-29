import {sendMessage} from "../../utils/telegramUtils";
import {PrismaClient} from "@prisma/client";
import {findUser_byUsername} from "../../utils/prisma/prismaUserUtils";

const prisma = new PrismaClient({});

export async function addHandler(messageArray: string[], chatId: string, messageSender: String) {
    try {
        // format: /add <amount> <description> <people>
        if (messageArray.length < 4) {
            return sendMessage(chatId, "Invalid format! Please use /add [amount] [description] [people]");
        }
        const amount = parseFloat(messageArray[1]);
        // find the index with @ prefix
        const firstUser: number = messageArray.findIndex((element: string) => element.startsWith("@"));
        const description = messageArray.slice(2, firstUser).join(" ");
        const payers = messageArray.slice(firstUser);
        const payersUsernames = payers.filter((person: string) => person.startsWith("@"));

        // combine any payers are numbers to the payer before them
        for (let i = 0; i < payers.length; i++) {
            if (!payers[i].startsWith("@") && i > 0) {
                payers[i - 1] += " " + payers[i];
                payers.splice(i, 1);
                i--;
            }
        }

        // check if all people are valid, with @ prefix
        let payerList = payers.filter((person: string) => person.startsWith("@"));

        // add the message sender to the front of the people list if not already there
        if (!messageArray.includes(`@${messageSender}`)) {
            payerList.unshift(`@${messageSender}`);
        }

        // same thing but for payersUsernames
        if (!messageArray.includes(`@${messageSender}`)) {
            payersUsernames.unshift(`@${messageSender}`);
        }


        // remove duplicates from the payer list
        payerList = [...new Set(payerList)];

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
            return sendMessage(chatId, "Cashshare Bot is not initialized for this group! Use /start to initialize.");
        }
        // check if all users are part of the group
        const users = [];

        // if not all users are part of the group, add them to the group
        for (const payer of payerList) {
            const person = payer.split(" ")[0];
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

        // if not all users are in the UserGroupBalance table, add them
        for (const user of users) {
            const userGroupBalance = await prisma.userGroupBalance.findFirst({
                where: {
                    userId: user.id,
                    groupId: chatId.toString()
                }
            });
            if (!userGroupBalance) {
                await prisma.userGroupBalance.create({
                    data: {
                        user: {
                            connect: {
                                id: user.id
                            }
                        },
                        group: {
                            connect: {
                                id: chatId.toString()
                            }
                        }
                    }
                });
            }
        }

        // update the group with the new users and create a UserGroupBalance for each user
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
        const payee = await findUser_byUsername(`@${messageSender}`);
        if (!payee) {
            return sendMessage(chatId, "Error adding expense! Please try again.");
        }

        // get the amount per person who does not have a specific amount
        let specifiedAmount = 0;
        // split the payerList into two lists: one with amounts and one without
        const payerListWithoutAmount = [];
        const payerListWithAmount = [];
        for (const person of payerList) {
            if (person.includes(" ")) {
                payerListWithAmount.push(person);
                specifiedAmount += parseFloat(person.split(" ")[1]);
            } else {
                payerListWithoutAmount.push(person);
            }
        }

        // add the expense to the UserGroupBalance table for each user without amount
        const amountPerPerson = (amount - specifiedAmount) / payerListWithoutAmount.length;
        for (const person of payerListWithoutAmount) {
            const user = await findUser_byUsername(person);
            if (!user) {
                return sendMessage(chatId, "Error adding expense! Please try again.");
            }
            if (user.id === payee.id) {
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
            }
            await prisma.userGroupBalance.update({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: chatId.toString()
                    }
                },
                data: {
                    balance: {
                        increment: amountPerPerson
                    }
                }
            });
        }

        // add the expense to the UserGroupBalance table for each user with amount
        for (const person of payerListWithAmount) {
            const user = await findUser_byUsername(person.split(" ")[0]);
            if (!user) {
                return sendMessage(chatId, "Error adding expense! Please try again.");
            }
            if (user.id === payee.id) {
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
            }
            await prisma.userGroupBalance.update({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: chatId.toString()
                    }
                },
                data: {
                    balance: {
                        increment: parseFloat(person.split(" ")[1])
                    }
                }
            });
        }


        await prisma.transaction.create({
            data: {
                totalAmount: amount,
                description: description,
                type: "NEW_EXPENSE",
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
                    create: payerList.map((payer) => {
                        const [username, specifiedAmount] = payer.split(" ");
                        return {
                            user: {
                                connect: {
                                    username: username,
                                },
                            },
                            amount: specifiedAmount ? parseFloat(specifiedAmount) : amountPerPerson,
                        };
                    }),
                }
            }
        });

        return sendMessage(chatId, `Added expense of \$${amount} for ${description} for ${payersUsernames.join(", ")}!`);
    } catch (error: any) {
        throw new Error(`An error occurred: ${error.message}`);
    }
}