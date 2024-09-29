import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { globalHandler } from './globalHandler';
import { sendMessage } from '../utils/telegramUtils';
import { startHandler } from './startHandler/startHandler';
import { addHandler } from './addHandler/addHandler';
import { groupBalanceHandler, individualBalanceHandler } from './balanceHandler/balanceHandler';
import { payHandler } from './payHandler/payHandler';
import { transactionsHandler } from './transactionsHandler/transactionsHandler';

vi.mock('../utils/utils');
vi.mock('./startHandler/startHandler');
vi.mock('./addHandler/addHandler');
vi.mock('./balanceHandler/balanceHandler');
vi.mock('./payHandler/payHandler');
vi.mock('./transactionsHandler/transactionsHandler');

describe('globalHandler', () => {
    let event: APIGatewayProxyEvent;
    let context: Context;

    beforeEach(() => {
        event = {
            body: JSON.stringify({ message: { chat: { id: 1, title: 'Test Chat' }, text: '/start', from: { username: 'testuser' } } }),
            headers: {},
            httpMethod: 'POST',
            isBase64Encoded: false,
            path: '/',
            pathParameters: null,
            queryStringParameters: null,
            stageVariables: null,
            requestContext: {
                accountId: '',
                apiId: '',
                authorizer: null,
                httpMethod: 'POST',
                identity: {
                    accessKey: null,
                    accountId: null,
                    apiKey: null,
                    apiKeyId: null,
                    caller: null,
                    clientCert: null,
                    cognitoAuthenticationProvider: null,
                    cognitoAuthenticationType: null,
                    cognitoIdentityId: null,
                    cognitoIdentityPoolId: null,
                    principalOrgId: null,
                    sourceIp: '',
                    user: null,
                    userAgent: '',
                    userArn: null,
                },
                path: '/',
                protocol: 'HTTP/1.1',
                requestId: '',
                requestTimeEpoch: 0,
                resourceId: '',
                resourcePath: '/',
                stage: '',
            },
            resource: '',
        } as APIGatewayProxyEvent;

        context = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: '',
            functionVersion: '',
            invokedFunctionArn: '',
            memoryLimitInMB: '',
            awsRequestId: '',
            logGroupName: '',
            logStreamName: '',
            getRemainingTimeInMillis: () => 0,
            done: () => {},
            fail: () => {},
            succeed: () => {},
        };
    });

    it('should return 400 if no message object is found', async () => {
        event.body = JSON.stringify({});
        const result = await globalHandler(event, context);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({ message: 'No message object found in the request body' });
    });

    it('should call startHandler for /start command', async () => {
        await globalHandler(event, context);
        expect(startHandler).toHaveBeenCalledWith('Test Chat', 1);
    });

    it('should call sendMessage for /help command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/help', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(sendMessage).toHaveBeenCalledWith(1, expect.stringContaining('/start'));
    });

    it('should call addHandler for /add command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/add 10 lunch', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(addHandler).toHaveBeenCalledWith(['\/add', '10', 'lunch'], 1, 'testuser');
    });

    it('should call individualBalanceHandler for /balance command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/balance', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(individualBalanceHandler).toHaveBeenCalledWith(1, 'testuser');
    });

    it('should call groupBalanceHandler for /groupbalance command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/groupbalance', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(groupBalanceHandler).toHaveBeenCalledWith(1);
    });

    it('should call payHandler for /pay command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/pay 10 @friend', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(payHandler).toHaveBeenCalledWith(['\/pay', '10', '@friend'], 1, 'testuser');
    });

    it('should call transactionsHandler for /transactions command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/transactions', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(transactionsHandler).toHaveBeenCalledWith(1);
    });

    it('should call sendMessage for unrecognized command', async () => {
        event.body = JSON.stringify({ message: { chat: { id: 1 }, text: '/unknown', from: { username: 'testuser' } } });
        await globalHandler(event, context);
        expect(sendMessage).toHaveBeenCalledWith(1, '');
    });
});