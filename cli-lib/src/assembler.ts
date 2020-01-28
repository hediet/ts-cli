import { ParsedCmd } from "./parser";
import { ErrorsImpl, Errors } from "./errors";

export interface CmdAssemblerOptions {
	namedParams: Record<string, NamedParam>;
}

export type NamedParamKind = "NoValue" | "SingleValue" | "MultiValue";

export interface NamedParam {
	kind: NamedParamKind;
	shortName?: string;
}

interface NamedParam2 extends NamedParam {
	name: string;
}

export class CmdAssembler {
	private readonly namedParams: Record<string, NamedParam2>;
	private readonly namedShortParams: Record<string, NamedParam2>;

	constructor(args: CmdAssemblerOptions) {
		this.namedParams = {};
		this.namedShortParams = {};
		for (const [key, value] of Object.entries(args.namedParams)) {
			const v = Object.assign({}, value, { name: key });
			this.namedParams[key] = v;
			if (value.shortName !== undefined) {
				if (this.namedShortParams[value.shortName]) {
					throw new Error(`Duplicated shortName: ${value.shortName}`);
				}
				this.namedShortParams[value.shortName] = v;
			}
		}
	}

	public process(parsedCmd: ParsedCmd): AssembledCmd {
		const namedArgs: Record<string, AssembledCmdArg> = {};
		const positionalArgs = new Array<AssembledCmdValue>();
		const errors = new ErrorsImpl<CmdAssembleError>();

		function setArg(param: NamedParam2, values: string[]) {
			if (namedArgs[param.name]) {
				errors.addError({
					kind: "ParameterAlreadySpecified",
					paramName: param.name,
					message: `A value for parameter "${param.name}" has already been specified.`,
				});
				return;
			}

			namedArgs[param.name] = {
				kind: "NamedArg",
				name: param.name,
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
					? this.namedShortParams
					: this.namedParams)[part.name];
				if (!argInfo) {
					errors.addError({
						kind: "UnknownParameter",
						paramName: part.name,
						message: `There is no parameter with name "${part.name}".`,
					});
					continue;
				}

				if (part.isGroup && argInfo.kind !== "NoValue") {
					errors.addError({
						kind: "GroupedParametersMustNotAcceptValues",
						paramName: part.name,
						message: `Grouped parameters must not accept values, but "${part.name}" does.`,
					});
				}

				switch (argInfo.kind) {
					case "MultiValue":
						const values = new Array<string>();
						if (part.value !== undefined) {
							values.push(part.value);
						}
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
								paramName: part.name,
								message: `A value is missing for argument "${part.name}".`,
							});
							continue;
						}
						setArg(argInfo, [value]);
						break;

					case "NoValue":
						if (part.value !== undefined) {
							errors.addError({
								kind: "ParameterDoesNotAcceptValue",
								paramName: part.name,
								message: `Parameter "${part.name}" does not accept any values.`,
							});
						}
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
			kind: "ParameterDoesNotAcceptValue";
			paramName: string;
			message: string;
	  }
	| {
			kind: "GroupedParametersMustNotAcceptValues";
			paramName: string;
			message: string;
	  }
	| {
			kind: "UnknownParameter";
			paramName: string;
			message: string;
	  }
	| {
			kind: "ParameterAlreadySpecified";
			paramName: string;
			message: string;
	  }
	| {
			kind: "MissingValue";
			paramName: string;
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
