# A CLI Library for NodeJS/TypeScript

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

Not production ready, but working towards it. Until then, it can safely be used for hobby projects.
Uses semantic versioning.

# Features

-   **Unopinionated** - Does not enforce some folder structure or other architecture decisions.
-   Works with `ts-node` or plain compiled files using `tsc`.
-   **Lightweight** - Only has a small API surface and no feature bloat.
-   **Fully typed** - Every parameter has a static type arguments are validated against.
-   **Fully reflective** - A help text is generated automatically.
-   **Embedded GUI** - Use `--cmd::gui` to launch an html based GUI which assists with specifying arguments.

# Installation

Use the following command to install the library using yarn:

```
yarn add @hediet/cli
```

# Usage

This example demonstrates almost the entiry API:

```ts
import {
	types,
	runCliWithDefaultArgs,
	cliInfoFromPackageJson,
	namedArg,
	positionalArg,
	createCliWithDefaultArgs,
} from "@hediet/cli";
import { join } from "path";

interface CmdData {
	run(): Promise<void>;
}

const cli = createCliWithDefaultArgs<CmdData>()
	// Defines a command with name `print`
	.addCmd({
		name: "print",
		description: "Prints selected files.",
		positionalArgs: [
			positionalArg("files", types.arrayOf(types.string), {
				description: "The files to print.",
			}),
		],
		namedArgs: {
			onlyFileNames: namedArg(types.booleanFlag, {
				shortName: "n",
				description: "Only print filenames",
			}),
			count: namedArg(types.int, {
				description: "The count",
			}),
		},
		// `args` is fully typed.
		getData: args => ({
			// Synchronously return an instance of `CmdData` here.
			async run() {
				for (const f of args.files) {
					if (args.onlyFileNames) {
						console.log(f);
					} else {
						console.log(f + " content");
					}
				}
			},
		}),
	});

// Processes command line arguments
// and invokes the handler with the selected command data.
// Also processes `--help`, `--version` and other global flags.
runCliWithDefaultArgs({
	info: cliInfoFromPackageJson(join(__dirname, "./package.json")),
	cli,
	// Asynchronously process an instance of `CmdData` here as you like.
	dataHandler: data => data.run(),
});
```

# GUI

This library uses the highly experimental [@hediet/semantic-json](https://github.com/hediet/semantic-json) and
[@hediet/semantic-json-react](https://github.com/hediet/semantic-json-react) libraries that should not be used on their own right now. They have an incredible potential.

For the example above, the generated UI looks like this:

![](./docs/gui.png)

The UI can be launched with `ts-node ./demo --cmd::gui`.

# TODOs

See open issues on github. Feel free to contribute!
