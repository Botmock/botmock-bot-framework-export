# Botmock Botframework Export

[![Build status](https://ci.appveyor.com/api/projects/status/tgof5738pfqppis7?svg=true)](https://ci.appveyor.com/project/nonnontrivial/botmock-botframework-export)

> Creates Botframework [LG](https://github.com/Microsoft/BotBuilder-Samples/tree/master/experimental/language-generation#language-generation-preview)  and [LU]() files from a Botmock project.

These files are able to be used within C# or JS projects in order to take advantage of the new **[Adaptive Dialogs]**(https://github.com/microsoft/BotBuilder-Samples/tree/master/experimental/adaptive-dialog#adaptive-dialog-preview) paradigm in Bot Framework.

## Guide

- clone this repository: `git clone git@github.com:Botmock/botmock-botframework-export.git`
- run `npm install`
- run `npm start`
- create `.env` (see Env section below for more on this)
- find generated `.lg` and `.lu` files in `/output`.
- [reference generated files in your existing C# code](https://github.com/microsoft/BotBuilder-Samples/blob/master/experimental/adaptive-dialog/docs/language-generation.md).

### Env

The script relies on a `.env` file that holds Botmock credentials for your project.

The file should look like so:

```shell
BOTMOCK_TOKEN=your-token
BOTMOCK_TEAM_ID=your-team-id
BOTMOCK_PROJECT_ID=your-project-id
BOTMOCK_BOARD_ID=your-board-id

```
