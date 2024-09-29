import {prisma} from "../../../libs/prisma";
import {User} from "@prisma/client";
import {updateUserGroupBalance_byUserIdGroupId} from "./prismaUserGroupBalanceUtils";
import {findUser_byUsername} from "./prismaUserUtils";

async function getNextTransactionId(chatId: string) {
    // find the number of transactions in the group
    const transactions = await prisma.transaction.findMany({
        where: {
            groupId: chatId.toString()
        }
    });
    if (transactions === null) {
        return 1;
    } else {
        return transactions.length + 1;
    }
}

export async function createTransaction_Expense(chatId: string, payee: User, totalAmount: number, description: string, payers: string[], defaultAmountPerPerson: number) {
    // update UserGroupBalance table
    await updateUserGroupBalance_byUserIdGroupId(payee, chatId, -totalAmount); // payee receives the total amount
    for (let payer of payers) {
        const [username, specifiedAmount] = payer.split(" ");
        const user = await findUser_byUsername(username);
        if (!user) {
            throw new Error(`User ${username} not found!`);
        }
        await updateUserGroupBalance_byUserIdGroupId(user, chatId, specifiedAmount ? parseFloat(specifiedAmount) : defaultAmountPerPerson);
    }

    // create a new transaction in the database
    return prisma.transaction.create({
        data: {
            type: "EXPENSE",
            totalAmount: totalAmount,
            description: description,
            groupTransactionId: await getNextTransactionId(chatId),
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
                create: payers.map((payer) => {
                    const [username, specifiedAmount] = payer.split(" ");
                    return {
                        user: {
                            connect: {
                                username: username,
                            },
                        },
                        amount: specifiedAmount ? parseFloat(specifiedAmount) : defaultAmountPerPerson,
                    };
                }),
            },
        }
    });
}


export async function createTransaction_Repayment(chatId: string, payee: User, totalAmount: number, description: string, payer: User) {
    // update UserGroupBalance table
    await updateUserGroupBalance_byUserIdGroupId(payee, chatId, totalAmount); // payee receives the total amount
    await updateUserGroupBalance_byUserIdGroupId(payer, chatId, -totalAmount); // payer pays the total amount and owes less money
    // create transaction
    return prisma.transaction.create({
        data: {
            type: "REPAYMENT",
            totalAmount: totalAmount,
            description: description,
            groupTransactionId: await getNextTransactionId(chatId),
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
                        user: {
                            connect: {
                                id: payer.id
                            }
                        },
                        amount: totalAmount
                    }
                ]
            },
        }
    });
}