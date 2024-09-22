// __tests__/globalHandler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import globalHandler from '../src/handlers/globalHandler';
import { sendMessage } from '../src/utils/utils';
import { startHandler } from '../src/handlers/startHandler';
import { addHandler } from '../src/handlers/addHandler';
import { groupBalanceHandler, individualBalanceHandler } from '../src/handlers/BalanceHandler';
import { payHandler } from '../src/handlers/payHandler';

vi.mock('../src/utils/utils');
vi.mock('../src/handlers/startHandler');
vi.mock('../src/handlers/addHandler');
vi.mock('../src/handlers/BalanceHandler');
vi.mock('../src/handlers/payHandler');

describe('globalHandler', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            body: {
                message: {
                    chat: { id: '123', title: 'Test Group' },
                    text: '',
                    from: { username: 'testuser' },
                },
            },
        };
        mockResponse = {
            send: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should send "No message object found in the request body" if no message object is present', async () => {
        mockRequest.body.message = undefined;

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.send).toHaveBeenCalledWith('No message object found in the request body');
    });

    it('should call startHandler for /start command', async () => {
        mockRequest.body.message.text = '/start';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(startHandler).toHaveBeenCalledWith('Test Group', '123', mockResponse);
    });

    it('should call sendMessage for /help command', async () => {
        mockRequest.body.message.text = '/help';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(sendMessage).toHaveBeenCalledWith('123', mockResponse, expect.stringContaining('Available commands'));
    });

    it('should call addHandler for /add command', async () => {
        mockRequest.body.message.text = '/add 10 expense @user1 @user2';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(addHandler).toHaveBeenCalledWith(['/add', '10', 'expense', '@user1', '@user2'], '123', mockResponse, 'testuser');
    });

    it('should call individualBalanceHandler for /balance command', async () => {
        mockRequest.body.message.text = '/balance';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(individualBalanceHandler).toHaveBeenCalledWith('123', mockResponse, 'testuser');
    });

    it('should call groupBalanceHandler for /groupbalance command', async () => {
        mockRequest.body.message.text = '/groupbalance';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(groupBalanceHandler).toHaveBeenCalledWith('123', mockResponse);
    });

    it('should call payHandler for /pay command', async () => {
        mockRequest.body.message.text = '/pay 10 @payee';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(payHandler).toHaveBeenCalledWith(['/pay', '10', '@payee'], '123', mockResponse, 'testuser');
    });

    it('should call sendMessage for unrecognized command', async () => {
        mockRequest.body.message.text = '/unknown';

        await globalHandler(mockRequest as Request, mockResponse as Response);

        expect(sendMessage).toHaveBeenCalledWith('123', mockResponse, expect.stringContaining('Command not recognized'));
    });
});