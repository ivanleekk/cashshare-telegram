import {Response} from "express";
import axios from "axios";
import {Prisma, PrismaClient} from "@prisma/client";
let prisma = new PrismaClient();

export async function sendMessage(chatId: String, res: Response<any, Record<string, any>>, text: String) {
    try {
        const response = await axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });
        res.send(response.data);
    } catch (error) {
        res.send(error);
    }
    return
}

export async function findUser_byUsername(username: string) {
    return prisma.user.findUnique({
        where: {
            username: username
        }
    });
}