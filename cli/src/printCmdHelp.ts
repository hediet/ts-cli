import { Cmd, NamedCmdArg } from "@hediet/cli-lib";

export interface HelpInfo {
	cmdName: string | undefined;
	appName: string;
}

export function printCmdHelp(info: HelpInfo, cmd: Cmd<any>): void {
	console.log(
		`usage: ${info.appName} ${info.cmdName} ${cmd.positionalArgs
			.map(arg => `{${arg.name}: ${arg.type.itemToString()}}`)
			.join(" ")}`
	);

	console.log("usage: app print --count={int} {count:int} {files:string}*");
	console.log("");
	console.log(`      ${cmd.description}`);
	console.log("");
	console.log("Positional Parameters");
	for (const arg of cmd.positionalArgs) {
		console.log(
			`      ${arg.name}: ${arg.type.toString()}    ${arg.description}`
		);
	}
	console.log();

	console.log("Required Parameters");
	printParameters(Object.values(cmd.namedArgs).filter(v => !v.isOptional));
	console.log();
	console.log("Optional Parameters");
	printParameters(Object.values(cmd.namedArgs).filter(v => v.isOptional));
}

function printParameters(params: NamedCmdArg<any>[]): void {
	for (const arg of Object.values(params)) {
		const short = arg.shortName !== undefined ? `-${arg.shortName}, ` : "";
		const val =
			arg.type.getRealType().kind === "NoValue" ? "" : `={${arg.type}}`;
		console.log(`      ${short}--${arg.name}${val}    ${arg.description}`);
	}
}
