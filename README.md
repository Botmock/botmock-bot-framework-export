# Botmock Bot Framework Export

Node.js project for importing [Botmock](https://botmock.com) projects in Bot Framework

> **Note**: The deprecated version of this exporter can be found in the `legacy` branch.

## Table of Contents

* [Overview](#overview)
  * [Usage](#usage)

## Overview

### Usage

> **Note**: prerequisites
> - [Node.js LTS version](https://nodejs.org/en/)

Running the following commands should allow you to generate restorable content from your Botmock project.

- `git clone git@github.com:Botmock/botmock-bot-framework-export.git`
- `cd botmock-bot-framework-export`
- `npm install`
- `mv ./sample.env ./env` and edit `.env` to contain your token and project ids
- `npm start`

`./output` should be generated in your project root.
