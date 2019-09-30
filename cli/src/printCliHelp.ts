import { Cli } from "@hediet/cli-lib";
import { getUsage } from "./printCmdHelp";
import { CliInfo } from "./handleExtendedCmd";

export function printCliHelp(cli: Cli<any>, info: CliInfo): void {
	console.log(`usage: ${info.appName} {command} {...args}`);
	console.log("");

	console.log("Available Commands");
	for (const [cmdName, cmd] of Object.entries(cli.subCmds)) {
		console.log(`   ${getUsage(cmdName, cmd)}  ${cmd.description}`);
	}
}
