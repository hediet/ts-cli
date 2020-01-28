import { Errors, ErrorsImpl } from "./errors";

export class ParsedCmd {
	constructor(
		readonly parts: ParsedCmdPart[],
		readonly errors: Errors<CmdParseError>
	) {}

	public get prefixValue(): string | undefined {
		const firstPart = this.parts[0];
		return firstPart && firstPart.kind === "Value"
			? firstPart.value
			: undefined;
	}

	public findNamedPart(options: {
		name?: string;
		short?: string;
	}): ParsedCmdNamedValue | undefined {
		return this.parts.find(
			(p): p is ParsedCmdNamedValue =>
				p.kind === "NamedValue" &&
				p.name === (p.isShort ? options.short : options.name)
		);
	}
}

export type CmdParseError = {
	kind: "MalformedArgumentError";
	argument: string;
	message: string;
};

export type ParsedCmdPart = ParsedCmdValue | ParsedCmdNamedValue;

export interface ParsedCmdValue {
	kind: "Value";
	value: string;
}

export interface ParsedCmdNamedValue {
	kind: "NamedValue";
	isShort: boolean;
	isGroup: boolean;
	name: string;
	value?: string;
}

interface ParserContext {
	onlyAcceptPositionalParts: boolean;
	errors: ErrorsImpl<CmdParseError>;
}

/**
 * Interprets a list of strings as parsed command.
 * Recognizes `--param arg` as parameter `param` without value,
 * followed by the value `arg`.
 * The assembler might associate the value with the parameter.
 * See README.md for the EBNF.
 */
export class CmdParser {
	public parseArgs(args: string[]): ParsedCmd {
		const errors = new ErrorsImpl<CmdParseError>();
		const state: ParserContext = {
			onlyAcceptPositionalParts: false,
			errors,
		};
		return new ParsedCmd(
			new Array<ParsedCmdPart>().concat(
				...args.map(arg => this.parseArg(arg, state))
			),
			errors
		);
	}

	private parseArg(arg: string, context: ParserContext): ParsedCmdPart[] {
		if (context.onlyAcceptPositionalParts) {
			return [{ kind: "Value", value: arg }];
		}

		if (arg == "--") {
			context.onlyAcceptPositionalParts = true;
			return [];
		}

		const isNamed = /^(--|-|\/)(.*)$/;
		const isNamedMatch = isNamed.exec(arg);
		if (!isNamedMatch) {
			return [{ kind: "Value", value: arg }];
		}

		const prefix = isNamedMatch[1];
		const rest = isNamedMatch[2];

		const namedArg = /^([a-zA-Z_:][a-zA-Z_:0-9\-]*)(=(.*))?$/;
		const namedArgMatch = namedArg.exec(rest);

		if (namedArgMatch) {
			const varName = namedArgMatch[1];
			const value: string | undefined = namedArgMatch[3];
			let isShort = prefix === "-";

			if (isShort && varName.length > 1) {
				return [...varName].map((char, idx) => ({
					kind: "NamedValue",
					name: char,
					// "-abc=test" will be treated as "-a -b -c=test".
					// The assembler will report an error, as only the assembler
					// can recognize "-abc test".
					value: idx !== varName.length - 1 ? undefined : value,
					isShort,
					isGroup: true,
				}));
			}

			return [
				{
					kind: "NamedValue",
					name: varName,
					value,
					isShort,
					isGroup: false,
				},
			];
		} else {
			context.errors.addError({
				kind: "MalformedArgumentError",
				argument: arg,
				message: `Argument "${arg}" is malformed. Use "--IDENTIFIER" to specify a named argument.`,
			});
			return [];
		}
	}
}
