import {prisma} from "../../../libs/prisma";
import {User} from "@prisma/client";

export async function findGroup_byId(chatId: string) {
    return prisma.group.findUnique({
        where: {
            id: chatId.toString()
        },
        include: {
            members: true
        }
    });
}

export async function updateGroup_byId_withNewMembers(chatId: string, newMembers: string[]) {
    return prisma.group.update({
        where: {
            id: chatId.toString()
        },
        data: {
            members: {
                connectOrCreate: newMembers.map((username) => ({
                    where: { username },
                    create: { username }
                }))
            }
        }
    });
}