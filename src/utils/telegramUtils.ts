import axios from "axios";


export async function sendMessage(chatId: string, text: string) {
    try {
        const response = await axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });
        // In Lambda, return the response instead of using res.send()
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

export async function sendMessage_withInlineKeyboard(chatId: string, text: string, inlineKeyboard: any) {
    try {
        const response = await axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
        // In Lambda, return the response instead of using res.send()
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

export async function updateMessage_withInlineKeyboard(chatId: string, messageId: string, text: string, inlineKeyboard: any) {
    try {
        const response = await axios.post(`${process.env.TELEGRAM_BOT_REQUEST_URL}/editMessageText`, {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
        // In Lambda, return the response instead of using res.send()
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}