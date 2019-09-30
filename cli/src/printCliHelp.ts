import { Cli } from "@hediet/cli-lib";
import { getUsage } from "./printCmdHelp";

export function printCliHelp(cli: Cli<any>): void {
	console.log("Available Commands");
	for (const [cmdName, cmd] of Object.entries(cli.subCmds)) {
		console.log(`   ${getUsage(cmdName, cmd)}  ${cmd.description}`);
	}
}
