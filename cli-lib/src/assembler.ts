import { ParsedCmd } from "./parser";
import { ErrorsImpl, Errors } from "./errors";

export interface CmdAssemblerOptions {
	namedArgs: Record<string, NamedArg>;
}

export type NamedArgKind = "NoValue" | "SingleValue" | "MultiValue";

export interface NamedArg {
	kind: NamedArgKind;
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
		const errors = new ErrorsImpl<CmdAssembleError>();

		function setArg(arg: NamedArg2, values: string[]) {
			if (namedArgs[arg.name]) {
				errors.addError({
					kind: "DuplicateArgument",
					argName: arg.name,
					message: `A value for argument "${arg.name}" has already been specified.`,
				});
				return;
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
					errors.addError({
						kind: "UnknownArgument",
						argName: part.name,
						message: `Did not expect an argument with name "${part.name}".`,
					});
					continue;
				}

				switch (argInfo.kind) {
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
							errors.addError({
								kind: "MissingValue",
								argName: part.name,
								message: `A value is missing for argument "${part.name}".`,
							});
							continue;
						}
						setArg(argInfo, [value]);
						break;

					case "NoValue":
						setArg(argInfo, []);
						break;
					default:
						const x: never = argInfo.kind;
				}
			} else {
				positionalArgs.push({ kind: "Value", value: part.value });
			}
		}

		return {
			namedArgs,
			positionalArgs,
			errors,
		};
	}
}

export interface AssembledCmd {
	positionalArgs: AssembledCmdValue[];
	namedArgs: Record<string, AssembledCmdArg>;
	errors: Errors<CmdAssembleError>;
}

export type CmdAssembleError =
	| {
			kind: "UnknownArgument";
			argName: string;
			message: string;
	  }
	| {
			kind: "DuplicateArgument";
			argName: string;
			message: string;
	  }
	| {
			kind: "MissingValue";
			argName: string;
			message: string;
	  };

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
