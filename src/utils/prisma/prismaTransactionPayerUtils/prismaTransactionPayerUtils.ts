import {prisma} from "../../../../libs/prisma";
import {User} from "@prisma/client";
import {updateUserGroupBalance_byUserIdGroupId} from "../prismaUserGroupBalance/prismaUserGroupBalanceUtils";
import {findUser_byUsername} from "../prismaUserUtils/prismaUserUtils";

export async function getTransactionPayer_byGroupIdUserId(groupId: string, userId: string) {
    return prisma.transactionPayer.findMany({
        where: {
            transaction: {
                groupId: groupId,
            },
            userId: userId
        }
    });
}

export async function getTotalExpenditure_byGroupIdUserId(groupId: string, userId: string) {
    const transactionPayers = await getTransactionPayer_byGroupIdUserId(groupId, userId);
    return transactionPayers.reduce((acc, transactionPayer) => acc + transactionPayer.amount, 0);
}
