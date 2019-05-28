import { IncomingMessage, ServerResponse, createServer } from "http";
import { BotFrameworkAdapter } from "botbuilder";
import { config } from "dotenv";
import { Bot } from "./bot";

// bring the env variables into scope
config();
const botInstance = new Bot({ token: process.env.BOTMOCK_TOKEN });

(async () => {
  try {
    const PORT = process.env.PORT || 8080;
    const adapter = new BotFrameworkAdapter({
      appId: process.env.MS_APP_ID,
      appPassword: process.env.MS_APP_PASSWORD,
    });
    createServer((req: IncomingMessage, res: ServerResponse) => {
      switch (req.method) {
        case "POST":
          // adapter.processActivity(req, res, async turnContext => {
          //   console.log(turnContext);
          //   // await bot.run(turnContext);
          // });
          break;
        default:
          console.error("only listening for POST requests");
      }
    }).listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT}`);
      console.log(`Sending a POST request will send a message to the bot`);
    });
  } catch (_) {
    process.exit(1);
  }
})();
