// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import globalHandler from "./handlers/globalHandler";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/", (req: Request, res: Response) => {
    // use a handler to handle the request
    globalHandler(req, res);
    return res;
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});