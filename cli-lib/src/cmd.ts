import {
	PositionalParamType,
	NamedParamType,
	ArgParseError,
	ParseResult,
} from "./param-types";
import { ParsedCmd } from "./parser";
import { CmdAssembler, NamedParam, CmdAssembleError } from "./assembler";
import { Errors, ErrorsImpl } from "./errors";
import { mapObject, fromEntries } from "./utils";
import {
	sObject,
	sLiteral,
	sObjectProp,
	NamedSerializer,
	DeserializeResult,
} from "@hediet/semantic-json";
import { InstantiatedCmd, cliNs } from "./schema";

export interface PositionalCmdParam<
	TName extends string = string,
	T = unknown
> {
	name: TName;
	description?: string;
	type: PositionalParamType<T>;
}

export class NamedCmdParam<T = unknown> {
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
			kind: "MissingRequiredParameter";
			message: string;
			param: NamedCmdParam;
	  }
	| {
			kind: "MissingPositionalValue";
			message: string;
			param: PositionalCmdParam;
	  };

export class Cmd<TCmdData> {
	constructor(
		public readonly name: string | undefined,
		public readonly description: string | undefined,
		public readonly positionalParams: PositionalCmdParam[],
		public readonly namedParams: Record<string, NamedCmdParam>,
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

		const namedArgs = mapObject(this.namedParams, (val) =>
			expectType<NamedParam>({
				kind:
					val.type.kind === "TypeWithDefaultValue"
						? val.type.type.kind
						: val.type.kind,
				shortName: val.shortName,
			})
		);

		const assembler = new CmdAssembler({
			namedParams: namedArgs,
		});

		const errors = new ErrorsImpl<
			CmdAssembleError | CmdInterpretError | ArgParseError
		>();

		const asmCmd = assembler.process(cmd);
		errors.addFrom(asmCmd.errors);

		const parsedArgs: Record<string, unknown> = {};
		for (const [key, param] of Object.entries(this.namedParams)) {
			const argVal = asmCmd.namedArgs[key];
			let parsed: ParseResult<unknown>;
			if (argVal) {
				parsed = param.type.getRealType().parseStrings(argVal.values);
			} else if (param.type.kind === "TypeWithDefaultValue") {
				parsed = { result: param.type.defaultValue };
			} else {
				errors.addError({
					kind: "MissingRequiredParameter",
					param: param,
					message: `Parameter "${key}" has not been specified, but is required.`,
				});
				continue;
			}

			if ("result" in parsed) {
				parsedArgs[key] = parsed.result;
			} else {
				errors.addError(parsed.error);
			}
		}

		const positionalArgs = asmCmd.positionalArgs.slice();
		for (const param of this.positionalParams) {
			let value: ParseResult<unknown>;
			const realType = param.type.getRealType();
			if (realType.kind === "SingleValue") {
				const arg = positionalArgs.shift();

				if (!arg) {
					if (param.type.kind === "TypeWithDefaultValue") {
						value = { result: param.type.defaultValue };
					} else {
						errors.addError({
							kind: "MissingPositionalValue",
							param: param,
							message: `Positional parameter "${param.name}" has not been specified, but is required.`,
						});
						continue;
					}
				} else {
					value = realType.parse(arg.value);
				}
			} else if (realType.kind === "MultiValue") {
				value = realType.parse(positionalArgs.map((a) => a.value));
			} else {
				const n: never = realType;
				throw new Error();
			}

			if ("result" in value) {
				parsedArgs[param.name] = value.result;
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

	public getSerializer(): NamedSerializer<InstantiatedCmd<TCmdData>> {
		return sObject({
			cmd: sLiteral(this.name || "main"),
			...fromEntries(
				this.positionalParams.map((arg) => [
					arg.name,
					sObjectProp({
						serializer: arg.type.serializer,
						optional: false,
						description: arg.description,
					}),
				])
			),
			...fromEntries(
				Object.entries(this.namedParams)
					.filter(([_, arg]) => !arg.excludeFromSchema)
					.map(([name, arg]) => [
						arg.name,
						sObjectProp({
							serializer: arg.type.serializer,
							optional: arg.isOptional,
							description: arg.description,
						}),
					])
			),
		})
			.refine<InstantiatedCmd<TCmdData>>({
				class: InstantiatedCmd,
				fromIntermediate: (i) => {
					delete i.cmd;
					const dataBuilder = this.dataBuilder;
					if (!dataBuilder) {
						throw new Error("No data builder set.");
					}
					return new InstantiatedCmd<TCmdData>(() =>
						dataBuilder(i as any)
					);
				},
				toIntermediate: (i) => {
					throw new Error("Not supported!");
				},
			})
			.defineAs(cliNs("cmd-" + (this.name || "main")));
	}
}
