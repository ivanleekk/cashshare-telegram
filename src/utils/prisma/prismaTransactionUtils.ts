import {prisma} from "../../../libs/prisma";
import {User} from "@prisma/client";

export async function createTransaction_Expense(chatId: string, payee: User, totalAmount: number, description: string, payers: string[], defaultAmountPerPerson: number) {
    // find the number of transactions in the group
    const transactions = await prisma.transaction.findMany({
        where: {
            groupId: chatId.toString()
        }
    });
    let transactionId;
    if (transactions === null) {
        transactionId = 1;
    }
    else {
        transactionId = transactions.length + 1;
    }
    return prisma.transaction.create({
        data: {
            type: "EXPENSE",
            totalAmount: totalAmount,
            description: description,
            groupTransactionId: transactionId,
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