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

export async function findTransaction_byId(transactionId: string) {
    return prisma.transaction.findUnique({
        where: {
            id: transactionId
        }
    });
}

export async function findTransactions_byGroupId(chatId: string) {
    return prisma.transaction.findMany({
        where: {
            groupId: chatId.toString(),
            isDeleted: false
        },
        include: {
            payers: {
                include: {
                    user: true
                }
            },
            payee: true
        }
    });
}

export async function findTransactions_byGroupTransactionId(chatId: string, groupTransactionId: number) {
    return prisma.transaction.findMany({
        where: {
            groupId: chatId.toString(),
            groupTransactionId: groupTransactionId
        },
        include: {
            payers: {
                include: {
                    user: true
                }
            },
            payee: true
        }
    });
}

export async function deleteTransactions_byGroupTransactionId(chatId: string, groupTransactionId: number) {
    // update all relevant userGroupBalances
    const transactions = await findTransactions_byGroupTransactionId(chatId, groupTransactionId);
    for (let transaction of transactions) {
        for (let payee of transaction.payee) {
            // TODO: Fix if I allow more than 1 payee
            await updateUserGroupBalance_byUserIdGroupId(payee, chatId, transaction.totalAmount);
        }
        for (let payer of transaction.payers) {
            await updateUserGroupBalance_byUserIdGroupId(payer.user, chatId, -payer.amount);
        }
    }
    return prisma.transaction.updateMany({
        where: {
            groupId: chatId.toString(),
            groupTransactionId: groupTransactionId
        },
        data: {
            isDeleted: true
        }
    });
}