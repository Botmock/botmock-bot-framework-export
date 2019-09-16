# Botmock Microsoft Bot Framework Integration

> **Note:** This Repo is now only respobsible for handling the elements of exporting to Microsoft's Bot Framework. If you are looking for the LUIS.ai export script, you can find it (here)[https://github.com/Botmock/botmock-luis-export]. 

[![Build status](https://ci.appveyor.com/api/projects/status/tgof5738pfqppis7?svg=true)](https://ci.appveyor.com/project/nonnontrivial/botmock-botframework-export)

Use Botmock developer handoff functionality with Microsoft [Bot Framework](https://dev.botframework.com/) and [Azure Bot services](https://azure.microsoft.com/en-us/free/ai/).

### Prerequisites

- [Node.js](https://nodejs.org/en/) >= 10.16.x

Which can be checked by running:

```shell
node --version
```

- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/blob/master/README.md) >= 4.3.0

- [Luis.ai](https://www.luis.ai) account

## Installation Guide

#### clone

Clone this repository, make it the current directory, and install dependencies:

```shell
git clone git@github.com:Botmock/botmock-botframework-export.git

cd botmock-botframework-export

npm i
```

#### set environment

Create `.env` in the created directory and fill in values for the following:

> The last field (also called "Authoring Key") should be obtainable by visiting "Application Settings" in the [luis.ai dashboard](https://www.luis.ai/applications).

The Botmock token can be found in the "Developer API" section of the Botmock dashboard

![token](https://downloads.intercomcdn.com/i/o/96904467/4d96178941d7bfb614994c92/developer-api.gif)

The Botmock team, board, and project ids can be found in the "settings" of any particular Botmock project

![ids](https://downloads.intercomcdn.com/i/o/96904238/df44841a2876f15781e91d45/Screenshot+2019-01-14+23.49.44.png)

```shell
BOTMOCK_TOKEN=@YOUR-BOTMOCK-TOKEN
BOTMOCK_TEAM_ID=@YOUR-BOTMOCK-TEAM-ID
BOTMOCK_BOARD_ID=@YOUR-BOTMOCK-BOARD-ID
BOTMOCK_PROJECT_ID=@YOUR-BOTMOCK-PROJECT-ID
LUIS_ENDPOINT_KEY=@YOUR-LUIS-ENDPOINT_KEY
```

#### run

Start the wizard which asks whether or not the HTTP server necessary for Botframework should be set up, and for a valid Luis.ai application id:

> Note that this command will attempt to **replace all existing Luis intents** in the application with those found in the Botmock project.

```shell
npm start
```

## Want to help?

Found bugs or have some ideas to improve this integration? We'd love to to hear from you! You can start by submitting an issue at the [Issues](https://github.com/Botmock/botmock-botframework-export/issues) tab. If you want, feel free to submit a pull request and propose a change as well!

### Submitting a Pull Request

1. Start with creating an issue if possible, the more information, the better!
2. Fork the Repository.
3. Make a new change under a branch based on master. Ideally, the branch should be based on the issue you made such as "issue-530".
4. Send the Pull Request, followed by a brief description of the changes you've made. Reference the issue.

_NOTE: Make sure to leave any sensitive information out of an issue when reporting a bug with imagery or copying and pasting error data. We want to make sure all your info is safe!_

## License

Botmock Microsoft Bot Framework Integration is copyright © 2019 Botmock. It is free software, and may be redistributed under the terms specified in the LICENSE file.
