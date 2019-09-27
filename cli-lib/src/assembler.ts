import { ParsedCmd, ParsedCmdNamedValue } from "./parser";

export interface CmdAssemblerOptions {
	namedArgs: Record<string, NamedArg>;
}

export type NamedArgMode = "NoValue" | "SingleValue" | "MultiValue";

export interface NamedArg {
	mode: NamedArgMode;
	shortName?: string;
}

interface NamedArg2 extends NamedArg {
	name: string;
}

export class CmdAssembler {
	private readonly namedArgs: Record<string, NamedArg2>;
	private readonly namedShortArgs: Record<string, NamedArg2>;

	constructor(args: CmdAssemblerOptions) {
		this.namedArgs = {};
		this.namedShortArgs = {};
		for (const [key, value] of Object.entries(args.namedArgs)) {
			const v = Object.assign({}, value, { name: key });
			this.namedArgs[key] = v;
			if (value.shortName !== undefined) {
				if (this.namedShortArgs[value.shortName]) {
					throw new Error(`Duplicated shortName: ${value.shortName}`);
				}
				this.namedShortArgs[value.shortName] = v;
			}
		}
	}

	public process(parsedCmd: ParsedCmd): AssembledCmd {
		const namedArgs: Record<string, AssembledCmdArg> = {};
		const positionalArgs = new Array<AssembledCmdValue>();

		function setArg(arg: NamedArg2, values: string[]) {
			if (namedArgs[arg.name]) {
				throw new Error("arg redefined");
			}

			namedArgs[arg.name] = {
				kind: "NamedArg",
				name: arg.name,
				values,
			};
		}

		const queue = parsedCmd.parts.slice(0);
		while (true) {
			const part = queue.shift();
			if (!part) {
				break;
			}
			if (part.kind === "NamedValue") {
				const argInfo = (part.isShort
					? this.namedShortArgs
					: this.namedArgs)[part.name];
				if (!argInfo) {
					throw new Error(`Unknown arg ${part.name}`);
				}

				switch (argInfo.mode) {
					case "MultiValue":
						const values = new Array<string>();
						while (queue[0] && queue[0].kind === "Value") {
							values.push(queue[0].value);
							queue.shift();
						}
						setArg(argInfo, values);
						break;

					case "SingleValue":
						let value: string | undefined = part.value;
						if (value === undefined) {
							if (queue[0] && queue[0].kind === "Value") {
								value = queue[0].value;
								queue.shift();
							}
						}
						if (!value) {
							throw new Error("No value given");
						}
						setArg(argInfo, [value]);
						break;

					case "NoValue":
						setArg(argInfo, []);
						break;
					default:
						const x: never = argInfo.mode;
				}
			} else {
				positionalArgs.push({ kind: "Value", value: part.value });
			}
		}

		return {
			namedArgs,
			positionalArgs,
		};
	}
}

export interface AssembledCmd {
	positionalArgs: AssembledCmdValue[];
	namedArgs: Record<string, AssembledCmdArg>;
}

export type AssembledCmdPart = AssembledCmdValue | AssembledCmdArg;

export interface AssembledCmdValue {
	kind: "Value";
	value: string;
}

export interface AssembledCmdArg {
	kind: "NamedArg";
	name: string;
	values: string[];
}
