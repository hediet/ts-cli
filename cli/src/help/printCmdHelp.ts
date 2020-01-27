import { Cmd, NamedCmdArg, ParamType, NamedParamType } from "@hediet/cli-lib";

export interface HelpInfo {
	appName: string;
}

export function getUsage(cmd: Cmd<any>): string {
	return `${cmd.name ? cmd.name + " " : ""}${cmd.positionalArgs
		.map(
			arg =>
				`{${arg.name}:${arg.type.itemToString()}}${starIfMultiple(
					arg.type
				)}`
		)
		.join(" ")} ${Object.values(cmd.namedArgs)
		.filter(v => !v.isOptional)
		.map(
			v =>
				`--${v.name}={${v.type.itemToString()}}${starIfMultiple(
					v.type
				)}`
		)
		.join(" ")}`;
}

export function printCmdHelp(info: HelpInfo, cmd: Cmd<any>): void {
	console.log(`usage: ${info.appName} ${getUsage(cmd)}`);
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
	printParameters(
		"      ",
		Object.values(cmd.namedArgs).filter(v => !v.isOptional)
	);
	console.log();
	console.log("Optional Parameters");
	printParameters(
		"      ",
		Object.values(cmd.namedArgs).filter(v => v.isOptional)
	);
}

function starIfMultiple(type: NamedParamType<any>): string {
	if (type.getRealType().kind === "MultiValue") {
		return "*";
	}
	return "";
}

export function printParameters(
	indentation: string,
	params: NamedCmdArg<any>[]
): void {
	for (const arg of Object.values(params)) {
		const short = arg.shortName !== undefined ? `-${arg.shortName}, ` : "";
		const val =
			arg.type.getRealType().kind === "NoValue"
				? ""
				: `={${arg.type.itemToString()}}${starIfMultiple(arg.type)}`;
		console.log(
			`${indentation}${short}--${arg.name}${val}    ${arg.description}`
		);
	}
}
