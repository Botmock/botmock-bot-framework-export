# botmock-botframework-export

Port a Botmock project to MS Botframework.

## prerequisites

- [Node.js](https://nodejs.org/en/) >= 10.15.x

```shell
node --version
```

- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/blob/master/README.md) >= 4.3.0

- [Luis.ai](https://www.luis.ai) account

## guide

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
