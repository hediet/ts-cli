export interface ParsedCmd {
	parts: ParsedCmdPart[];
}

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

interface ParserState {
	onlyPositional: boolean;
}

export class CmdParser {
	public parseArgs(args: string[]): ParsedCmd {
		const state: ParserState = { onlyPositional: false };
		return {
			parts: new Array<ParsedCmdPart>().concat(
				...args.map(arg => this.parseArg(arg, state))
			),
		};
	}

	private parseArg(arg: string, state: ParserState): ParsedCmdPart[] {
		if (state.onlyPositional) {
			return [{ kind: "Value", value: arg }];
		}

		if (arg == "--") {
			state.onlyPositional = true;
			return [];
		}

		const isNamed = /^(--|-|\/)(.*)$/;
		const isNamedMatch = isNamed.exec(arg);
		if (!isNamedMatch) {
			return [{ kind: "Value", value: arg }];
		}

		const prefix = isNamedMatch[1];
		const rest = isNamedMatch[2];

		const namedArg = /^([a-zA-Z0-9_]+)(=(.*))?$/;
		const namedArgMatch = namedArg.exec(rest);

		if (namedArgMatch) {
			const varName = namedArgMatch[1];
			const value: string | undefined = namedArgMatch[3];
			let isShort = prefix === "-";

			if (isShort && varName.length > 1) {
				return [...varName].map((char, idx) => ({
					kind: "NamedValue",
					name: char,
					// "-abc=test" will be treated as "-a -b -c=test"
					// The assembler will report an error for this case.
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
			throw new Error("TODO");
		}
	}
}
