# llm-code-harvester

A simple CLI tool to harvest code snippets from a specified directory,
prefix each file with its relative path and output a combined stream ready for Large Language Model (LLM) ingestion.

## Features

* Recursively collects all files under a target directory.
* Prefixes each file with a comment header showing its relative path.
* Supports Node.js v16+.
* Uses native clipboard utilities (`pbcopy`, `clip`, `xclip`, `xsel`) when available.
* Falls back to writing output to `stdout` if no clipboard utility is found.
* Easy installation via `npm` or `npx`.

## Prerequisites

* Node.js v16 or higher
* npm (comes with Node.js)
* Optional: native clipboard utility (macOS: `pbcopy`; Windows: `clip`; Linux: `xclip` or `xsel`)

## Installation

Install globally via npm:

```bash
npm install -g llm-code-harvester
```

Or use `npx` without global installation:

```bash
npx llm-code-harvester <directory>
```

## Usage

Run the CLI against a directory to collect and copy code snippets:

```bash
# Harvest snippets from src/
llm-code-harvester ./src
```

If a clipboard utility is detected, the combined output is copied to the clipboard.
Otherwise, the output is printed to `stdout`.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/llm-code-harvester.git
cd llm-code-harvester
npm install  # runs `prepare` to build
```

### Build

```bash
npm run build
```

### Link for Local Testing

```bash
npm link
```

This makes the `llm-code-harvester` command available globally on your machine for testing.

### Tests

Run unit and integration tests with Jest:

```bash
npm test
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.
