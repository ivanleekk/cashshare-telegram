import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { sendMessage } from '../utils/telegramUtils';
import { startHandler } from './startHandler/startHandler';
import { addHandler } from './addHandler/addHandler';
import { groupBalanceHandler, individualBalanceHandler } from './balanceHandler/balanceHandler';
import { payHandler } from './payHandler/payHandler';
import { transactionsHandler } from './transactionsHandler/transactionsHandler';
import {deleteHandler} from "./deleteHandler/deleteHandler";

export const globalHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No message object found in the request body" }),
            };
        }

        const chatId = body.message.chat.id;
        const messageText = body.message.text || "";
        const chatTitle = body.message.chat.title;
        const messageArray = messageText.split(" ");
        const messageSender = body.message.from.username;
        if (messageArray[0].startsWith("/start")) {
            await startHandler(chatTitle, chatId);
        } else if (messageArray[0].startsWith("/help")) {
            await sendMessage(chatId, "Available commands: \n" +
                "/start - Initialize Cashshare Bot for the group \n" +
                "/add - Add an expense \n" +
                "/pay - Pay back your friends \n" +
                "/balance - Check the balance\n" +
                "/groupbalance - Check the group balance\n" +
                "/transactions - Check the transactions\n");
        } else if (messageArray[0].startsWith("/add")) {
            await addHandler(messageArray, chatId, messageSender);
        } else if (messageArray[0].startsWith("/balance")) {
            await individualBalanceHandler(chatId, messageSender);
        } else if (messageArray[0].startsWith("/groupbalance")) {
            await groupBalanceHandler(chatId);
        } else if (messageArray[0].startsWith("/pay")) {
            await payHandler(messageArray, chatId, messageSender);
        } else if (messageArray[0].startsWith("/transactions")) {
            await transactionsHandler(chatId);
        } else if (messageArray[0].startsWith("/delete")){
            await deleteHandler(messageArray, chatId);
        } else {
            await sendMessage(chatId, '');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Request processed successfully" }),
        };
    } catch (error:any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An error occurred", error: error.message }),
        };
    }
};