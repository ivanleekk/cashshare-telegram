import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { sendMessage } from '../utils/utils';
import { startHandler } from './startHandler';
import { addHandler } from './addHandler';
import { groupBalanceHandler, individualBalanceHandler } from './BalanceHandler';
import { payHandler } from './payHandler';
import { transactionsHandler } from './transactionsHandler';

export const globalHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body || '{}');
    if (!body.message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "No message object found in the request body" }),
        };
    }
    const res = context.res;
    const chatId = body.message.chat.id;
    const messageText = body.message.text || "";
    const chatTitle = body.message.chat.title;
    const messageArray = messageText.split(" ");
    const messageSender = body.message.from.username;

    switch (messageArray[0]) {
        case "/start":
            await startHandler(chatTitle, chatId, res);
            break;
        case "/help":
            await sendMessage(chatId, res, "Available commands: \n" +
                "/start - Initialize Cashshare Bot for the group \n" +
                "/add - Add an expense \n" +
                "/pay - Pay back your friends \n" +
                "/balance - Check the balance\n" +
                "/groupbalance - Check the group balance\n" +
                "/transactions - Check the transactions\n");
            break;
        case "/add":
            await addHandler(messageArray, chatId, res, messageSender);
            break;
        case "/balance":
            await individualBalanceHandler(chatId, res, messageSender);
            break;
        case "/groupbalance":
            await groupBalanceHandler(chatId, res);
            break;
        case "/pay":
            await payHandler(messageArray, chatId, res, messageSender);
            break;
        case "/transactions":
            await transactionsHandler(chatId, res);
            break;
        case "/":
            await sendMessage(chatId, res, "Command not recognized. Please use /help to see the available commands.");
            break;
        default:
            await sendMessage(chatId, res, '');
            break;
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Request processed successfully" }),
    };
};