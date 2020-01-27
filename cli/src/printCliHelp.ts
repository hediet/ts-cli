import { Cli } from "@hediet/cli-lib";
import { getUsage, printParameters } from "./printCmdHelp";
import { CliInfo } from "./runCliWithDefaultArgs";

export function printCliHelp(cli: Cli<any>, info: CliInfo): void {
	console.log(`usage: ${info.appName} {command} {...args}`);
	console.log(`version: ${info.version}`);
	console.log("");

	console.log("Available Commands");
	console.log("");
	for (const cmd of cli.cmds) {
		console.log(`   ${getUsage(cmd)}  ${cmd.description}`);
	}

	console.log("");
	console.log("Global Parameters");
	console.log("");
	console.log("  Required Parameters");
	printParameters(
		"       ",
		Object.values(cli.globalNamedArgs).filter(v => !v.isOptional)
	);
	console.log();
	console.log("  Optional Parameters");
	printParameters(
		"       ",
		Object.values(cli.globalNamedArgs).filter(v => v.isOptional)
	);
}
