# botmock-botframework-export

This is a script that ports a Botmock project to MS Botframework.

## prerequisites

- [Node.js](https://nodejs.org/en/) >= 10.15.x

```shell
node --version
```

- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/blob/master/README.md) >= 4.3.0

## guide

Clone this repository and install dependencies:

```shell
git clone git@github.com:Botmock/botmock-botframework-export.git

npm i
```

Create `/.env` and fill in values for the following:

```shell
BOTMOCK_TOKEN="@YOUR-BOTMOCK-TOKEN"
BOTMOCK_TEAM_ID="@YOUR-BOTMOCK-TEAM-ID"
BOTMOCK_BOARD_ID="@YOUR-BOTMOCK-BOARD-ID"
BOTMOCK_PROJECT_ID="@YOUR-BOTMOCK-PROJECT-ID"
MS_APP_ID="@YOUR-MS-APP-ID"
MS_APP_PASSWORD="@YOUR-MS-APP-PASSWORD"
```

Start the HTTP server:

```shell
npm start
```
