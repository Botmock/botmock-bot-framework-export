# Botmock Bot Framework Export

[![Build status](https://ci.appveyor.com/api/projects/status/tgof5738pfqppis7?svg=true)](https://ci.appveyor.com/project/nonnontrivial/botmock-botframework-export)

> Creates Bot Framework [Language Generation](https://github.com/Microsoft/BotBuilder-Samples/tree/master/experimental/language-generation#language-generation-preview), and [LU](https://github.com/Microsoft/botbuilder-tools/blob/master/packages/Ludown/docs/lu-file-format.md) files from a Botmock project for use with .NET, C#, or Node JS Bot Framework projects.

The files generated by this script are able to be used within .NET, C#, or Node JS projects in order to take advantage of the new [**Adaptive Dialog**](https://github.com/microsoft/BotBuilder-Samples/tree/master/experimental/adaptive-dialog#adaptive-dialog-preview) paradigm in Bot Framework.

## Prerequisites

- [Node JS](https://nodejs.org/en/) version 12.x

```bash
#determine nodejs version
node --version
```

- [.NET Core SDK](https://dotnet.microsoft.com/download) version 2.1.x

```bash
# determine dotnet version
dotnet --version
```

- [C#, .NET, or Node JS project able to consume `.lg` and `.lu` files](https://github.com/microsoft/BotBuilder-Samples/tree/master/experimental/adaptive-dialog/csharp_dotnetcore/04.core-bot#using-cli)

> Note that to take advantage of the generated `.lu` file, you must have a [luis.ai account](https://www.luis.ai/).

## Guide

- clone this repository: `git clone git@github.com:Botmock/botmock-botframework-export.git`
- run `npm install`
- run `npm start`
- create `.env` (see Env section below for more on this) in the project root
- find generated `.lg` and `.lu` files in `botmock-botframework-export/output`
- move generated files to your project directory
- [reference generated Language Generation file in your existing .NET, C#, or Node JS code](https://github.com/microsoft/BotBuilder-Samples/blob/master/experimental/adaptive-dialog/docs/language-generation.md).

### Env

The script relies on a `.env` file that holds Botmock credentials for your project.

The file should look like so:

```shell
BOTMOCK_TOKEN=your-token
BOTMOCK_TEAM_ID=your-team-id
BOTMOCK_PROJECT_ID=your-project-id
BOTMOCK_BOARD_ID=your-board-id

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

The Botmock Botframework Export Script is copyright © 2019 Botmock. It is free software, and may be redistributed under the terms specified in the LICENSE file.
