import {prisma} from "../../../libs/prisma";

export async function findUser_byUsername(username: string) {
    return prisma.user.findUnique({
        where: {
            username: username
        }
    });
}

export async function createUser(username: string) {
    return prisma.user.create({
        data: {
            username: username
        }
    });
}