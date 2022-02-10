import { Cli } from "@hediet/cli-lib";
import { getUsage, printParameters } from "./printCmdHelp";
import { CliInfo } from "../cli-info";

export function printCliHelp(
	cli: Cli<any>,
	info: CliInfo,
	hasMainCommand?: boolean
): void {
	if (!hasMainCommand) {
		console.log(`usage: ${info.appName} {command} {...args}`);
		console.log(`version: ${info.version}`);
		console.log("");
	}

	if (hasMainCommand) {
		console.log("Available Sub-Commands");
	} else {
		console.log("Available Commands");
	}

	console.log("");
	for (const cmd of cli.cmds) {
		if (hasMainCommand && cmd.name === undefined) {
			continue;
		}

		console.log(
			`  ${info.appName} ${getUsage(cmd)}  ${cmd.description || ""}`
		);
	}

	console.log("");
	console.log("Global Parameters");
	console.log("");
	console.log("  Required Parameters");
	printParameters(
		"       ",
		Object.values(cli.globalNamedParams).filter(v => !v.isOptional)
	);
	console.log();
	console.log("  Optional Parameters");
	printParameters(
		"       ",
		Object.values(cli.globalNamedParams).filter(v => v.isOptional)
	);
}
