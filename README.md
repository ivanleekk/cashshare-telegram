# cashshare-telegram
A telegram bot that can be added to groups to share costs with people in the group

## Deployment
1. Clone the repository
2. Install the requirements
3. Create a `.env` file with the following content:
```
TELEGRAM_BOT_API_KEY="your-telegram-bot-api-key"
TELEGRAM_BOT_REQUEST_URL="https://api.telegram.org/bot{bot-api-key}"

# Connect to Supabase via connection pooling with Supavisor.
DATABASE_URL="your-database-url"

# Direct connection to the database. Used for migrations.
DIRECT_URL="your-database-url"

SERVERLESS_ACCESS_KEY="your-serverless-access-key"

PRISMA_CLIENT_ENGINE_TYPE="binary"
```

4. Run the following commands:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the bot using the following command:
```bash
serverless deploy
```

5i. To run the bot on dev environment, use the following command:
```bash
dotenvx run --env-file=.env.dev -- serverless deploy
```