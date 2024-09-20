import {Response} from "express";
import axios from "axios";

export function sendMessage(chatId: String, res: Response<any, Record<string, any>>, text: String) {
    return axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode:'HTML'
        })
        .then((response) => {
            res.send(response.data);
        })
        .catch((error) => {
            res.send(error);
        });
}