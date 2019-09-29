import { Cmd } from "@hediet/cli-lib";

export interface HelpInfo {
	cmdName: string | undefined;
	appName: string;
}

export function printCmdHelp(info: HelpInfo, cmd: Cmd<any>): void {
	/*console.log(
		`Syntax: ${info.appName} ${info.cmdName} ${cmd.positionalArgs
			.map(arg => `{${arg.name}: ${arg.type.toString()}}`)
			.join(" ")}`
	);

*/
	console.log("usage: app print --count={int} {count: int} {files: string}*");
	console.log("");
	console.log(`      ${cmd.description}`);
	console.log("");
	console.log("Positional Parameters");
	console.log("      count: int       The count    ");
	console.log("      files: string[]  The files to print  ");
	console.log();

	console.log("Required Parameters");
	for (const [key, arg] of Object.entries(cmd.namedArgs)) {
		const short = arg.shortName !== undefined ? `-${arg.shortName}, ` : "";
		const val =
			arg.type.getRealType().kind === "NoValue" ? "" : `={${arg.type}}`;
		console.log(`      ${short}--${key}${val}    ${arg.description}`);
	}
}
