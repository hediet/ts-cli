import { PositionalParamType, NamedParamType } from "./param-types";
import { ParsedCmd } from "./parser";
import { CmdAssembler, NamedArg, CmdAssembleError } from "./assembler";
import { Errors, ErrorsImpl } from "./errors";
import { mapObject } from "./utils";

export interface PositionalCmdArg<TName extends string = string, T = unknown> {
	name: TName;
	description?: string;
	type: PositionalParamType<T>;
}

export class NamedCmdArg<T = unknown> {
	constructor(
		public readonly name: string,
		public readonly type: NamedParamType<T>,
		public readonly description?: string,
		public readonly shortName?: string
	) {}

	get isOptional(): boolean {
		return this.type.kind === "TypeWithDefaultValue";
	}
}

export type CmdInterpretError =
	| {
			kind: "MissingRequiredArgument";
			message: string;
			argument: NamedCmdArg;
	  }
	| {
			kind: "MissingPositionalValue";
			message: string;
			argument: PositionalCmdArg;
	  };

export class Cmd<TCmdData> {
	constructor(
		public readonly description: string | undefined,
		public readonly positionalArgs: PositionalCmdArg[],
		public readonly namedArgs: Record<string, NamedCmdArg>,
		private readonly dataBuilder: (
			args: Record<string, unknown>
		) => TCmdData
	) {}

	public parseArgsAndGetData(
		cmd: ParsedCmd
	):
		| { data: TCmdData }
		| {
				errors: Errors<CmdAssembleError | CmdInterpretError>;
		  } {
		const args = this.parseArgs(cmd);
		if (args.errors.hasErrors) {
			return { errors: args.errors };
		}
		const data = this.dataBuilder(args.values);
		return { data };
	}

	public parseArgs(
		cmd: ParsedCmd
	): {
		values: Record<string, unknown>;
		errors: Errors<CmdAssembleError | CmdInterpretError>;
	} {
		function expectType<T>(item: T) {
			return item;
		}

		const namedArgs = mapObject(this.namedArgs, val =>
			expectType<NamedArg>({
				kind:
					val.type.kind === "TypeWithDefaultValue"
						? val.type.type.kind
						: val.type.kind,
				shortName: val.shortName,
			})
		);

		const assembler = new CmdAssembler({
			namedArgs,
		});

		const errors = new ErrorsImpl<CmdAssembleError | CmdInterpretError>();

		const asm = assembler.process(cmd);
		errors.addFrom(asm.errors);

		const values: Record<string, unknown> = {};
		for (const [key, argInfo] of Object.entries(this.namedArgs)) {
			const argVal = asm.namedArgs[key];
			let parsed: unknown;
			if (argVal) {
				parsed = argInfo.type.getRealType().parseStrings(argVal.values);
			} else if (argInfo.type.kind === "TypeWithDefaultValue") {
				parsed = argInfo.type.defaultValue;
			} else {
				errors.addError({
					kind: "MissingRequiredArgument",
					argument: argInfo,
					message: `Argument "${key}" has not been specified, but is required.`,
				});
				continue;
			}
			values[key] = parsed;
		}

		const positionalArgs = asm.positionalArgs.slice();
		for (const argInfo of this.positionalArgs) {
			let value: unknown;
			const realType = argInfo.type.getRealType();
			if (realType.kind === "SingleValue") {
				const arg = positionalArgs.shift();

				if (!arg) {
					if (argInfo.type.kind === "TypeWithDefaultValue") {
						value = argInfo.type.defaultValue;
					} else {
						errors.addError({
							kind: "MissingPositionalValue",
							argument: argInfo,
							message: `Positional argument "${argInfo.name}" has not been specified, but is required.`,
						});
						continue;
					}
				} else {
					value = realType.parse(arg.value);
				}
			} else if (realType.kind === "MultiValue") {
				value = realType.parse(positionalArgs.map(a => a.value));
			} else {
				const n: never = realType;
				throw new Error();
			}
			values[argInfo.name] = value;
		}

		return { values, errors };
	}
}
