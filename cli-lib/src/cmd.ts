import {
	PositionalParamType,
	NamedParamType,
	ArgParseError,
	ParseResult,
} from "./param-types";
import { ParsedCmd } from "./parser";
import { CmdAssembler, NamedArg, CmdAssembleError } from "./assembler";
import { Errors, ErrorsImpl } from "./errors";
import { mapObject } from "./utils";
import {
	BaseSerializer,
	sObject,
	sLiteral,
	field,
	namespace,
	NamedSerializer,
} from "@hediet/semantic-json";
import { InstantiatedCmd, cliNs } from "./schema";
import { deserializationValue } from "@hediet/semantic-json/dist/src/result";

export interface PositionalCmdArg<TName extends string = string, T = unknown> {
	name: TName;
	description?: string;
	type: PositionalParamType<T>;
}

export class NamedCmdArg<T = unknown> {
	constructor(
		public readonly name: string,
		public readonly type: NamedParamType<T>,
		public readonly description: string | undefined,
		public readonly shortName: string | undefined,
		public readonly excludeFromSchema: boolean
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
		public readonly name: string | undefined,
		public readonly description: string | undefined,
		public readonly positionalArgs: PositionalCmdArg[],
		public readonly namedArgs: Record<string, NamedCmdArg>,
		private readonly dataBuilder?: (
			args: Record<string, unknown>
		) => TCmdData
	) {}

	public parseArgs(
		cmd: ParsedCmd
	): {
		parsedArgs: { readonly [paramName: string]: unknown };
		dataFactory: (() => TCmdData) | undefined;
		errors: Errors<CmdAssembleError | CmdInterpretError | ArgParseError>;
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

		const errors = new ErrorsImpl<
			CmdAssembleError | CmdInterpretError | ArgParseError
		>();

		const asm = assembler.process(cmd);
		errors.addFrom(asm.errors);

		const parsedArgs: Record<string, unknown> = {};
		for (const [key, argInfo] of Object.entries(this.namedArgs)) {
			const argVal = asm.namedArgs[key];
			let parsed: ParseResult<unknown>;
			if (argVal) {
				parsed = argInfo.type.getRealType().parseStrings(argVal.values);
			} else if (argInfo.type.kind === "TypeWithDefaultValue") {
				parsed = { result: argInfo.type.defaultValue };
			} else {
				errors.addError({
					kind: "MissingRequiredArgument",
					argument: argInfo,
					message: `Argument "${key}" has not been specified, but is required.`,
				});
				continue;
			}

			if ("result" in parsed) {
				parsedArgs[key] = parsed.result;
			} else {
				errors.addError(parsed.error);
			}
		}

		const positionalArgs = asm.positionalArgs.slice();
		for (const argInfo of this.positionalArgs) {
			let value: ParseResult<unknown>;
			const realType = argInfo.type.getRealType();
			if (realType.kind === "SingleValue") {
				const arg = positionalArgs.shift();

				if (!arg) {
					if (argInfo.type.kind === "TypeWithDefaultValue") {
						value = { result: argInfo.type.defaultValue };
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

			if ("result" in value) {
				parsedArgs[argInfo.name] = value.result;
			} else {
				errors.addError(value.error);
			}
		}

		const dataBuilder = this.dataBuilder;
		const dataFactory =
			dataBuilder && !errors.hasErrors
				? () => dataBuilder(parsedArgs)
				: undefined;

		return { parsedArgs, errors, dataFactory };
	}

	public getSerializer(): NamedSerializer<InstantiatedCmd<TCmdData>, any> {
		return sObject({
			properties: {
				cmd: sLiteral(this.name || "main"),
				...Object.fromEntries(
					this.positionalArgs.map(arg => [
						arg.name,
						field({
							serializer: arg.type.serializer,
							optional: false,
							description: arg.description,
						}),
					])
				),
				...Object.fromEntries(
					Object.entries(this.namedArgs)
						.filter(([_, arg]) => !arg.excludeFromSchema)
						.map(([name, arg]) => [
							arg.name,
							field({
								serializer: arg.type.serializer,
								optional: arg.isOptional,
								description: arg.description,
							}),
						])
				),
			},
		})
			.refine<InstantiatedCmd<TCmdData>>({
				canSerialize: (i): i is InstantiatedCmd<TCmdData> =>
					i instanceof InstantiatedCmd,
				deserialize: i => {
					delete i.cmd;
					const dataBuilder = this.dataBuilder;
					if (!dataBuilder) {
						throw new Error("No data builder set.");
					}
					return deserializationValue(
						new InstantiatedCmd<TCmdData>(() =>
							dataBuilder(i as any)
						)
					);
				},
				serialize: i => {
					throw new Error("Not supported!");
				},
			})
			.defineAs(cliNs("cmd-" + (this.name || "main")));
	}
}
