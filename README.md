# Botmock Microsoft Bot Framework Integration

Easily utilize Botmock's Developer Handoff functionality to use conversational design data with Microsoft's Bot Framework and Azure Bot services.

- [Tutorial Video](https://www.youtube.com/watch?v=3P8XwT20QXs)
- Documentation (Coming Soon)
- [Support Email](mailto:help@botmock.com)

## Prerequisites

- [Node.js](https://nodejs.org/en/) >= 10.15.x

```shell
node --version
```

- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/blob/master/README.md) >= 4.3.0

- [Luis.ai](https://www.luis.ai) account

## Guide

Clone this repository and install dependencies:

```shell
git clone git@github.com:Botmock/botmock-botframework-export.git

cd botmock-botframework-export

npm i
```

Create `/.env` and fill in values for the following:

```shell
BOTMOCK_TOKEN="@YOUR-BOTMOCK-TOKEN"
BOTMOCK_TEAM_ID="@YOUR-BOTMOCK-TEAM-ID"
BOTMOCK_BOARD_ID="@YOUR-BOTMOCK-BOARD-ID"
BOTMOCK_PROJECT_ID="@YOUR-BOTMOCK-PROJECT-ID"
LUIS_ENDPOINT_KEY="@YOUR-LUIS-ENDPOINT_KEY"
```

> The last field (also called "Authoring Key") should be obtainable by visiting settings in the Luis.ai dashboard.

Start the HTTP server:

```shell
npm start
```

Find the created app in the Luis.ai dashboard and publish it.

Open Bot Framework Emulator and point it to `http://localhost:8080/messages`.

## Want to help?

Found bugs or have some ideas to improve this plugin? We'd love to to hear from you! You can start by submitting an issue at the [Issues](https://github.com/Botmock/botmock-botframework-export/issues) tab. If you want, feel free to submit a pull request and propose a change as well!

### Submitting a Pull Request
1. Adding a Pull Request
2. Start with creating an issue if possible, the more information, the better!
3. Fork the Repository
4. Make a new change under a branch based on master. Ideally, the branch should be based on the issue you made such as issue-530
5. Send the Pull Request, followed by a brief description of the changes you've made. Reference the issue.

*NOTE: Make sure to leave any sensitive information out of an issue when reporting a bug with imagery or copying and pasting error data. We want to make sure all your info is safe!*

## License
Botmock Dialogflow Export is copyright © 2019 Botmock. It is free software, and may be redistributed under the terms specified in the LICENSE file.
