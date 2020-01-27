import {
	NamedCmdArgOptions,
	NamedArgsToTypes,
	PositionalArgsToTypes,
} from "./cmd-builder";
import { Cmd, CmdInterpretError, PositionalCmdArg, NamedCmdArg } from "./cmd";
import { CmdParser, ParsedCmd, CmdParseError } from "./parser";
import { Errors, ErrorsImpl } from "./errors";
import { CmdAssembleError } from "./assembler";
import { mapObject } from "./utils";
import {
	sUnion,
	namespace,
	BaseSerializer,
	NamedSerializer,
} from "@hediet/semantic-json";
import { InstantiatedCmd, cliNs } from "./schema";
import { ArgParseError } from "./param-types";

export class Cli<
	TCmdData,
	TGlobalNamedArgs extends Record<string, NamedCmdArgOptions> = {}
> {
	public get TCmdData(): TCmdData {
		throw new Error("Do not access this field on runtime");
	}

	public get TGlobalNamedArgs(): TGlobalNamedArgs {
		throw new Error("Do not access this field on runtime");
	}

	private readonly _cmds: Cmd<TCmdData>[] = [];
	private readonly _globalNamedArgs: Record<string, NamedCmdArg> = {};

	public get mainCmd(): Cmd<TCmdData> | undefined {
		return this.findCmd(undefined);
	}

	public findCmd(name: string | undefined): Cmd<TCmdData> | undefined {
		return this._cmds.find(c => c.name === name);
	}

	public get cmds(): readonly Cmd<TCmdData>[] {
		return this._cmds;
	}

	public get globalNamedArgs(): { readonly [name: string]: NamedCmdArg } {
		return this._globalNamedArgs;
	}

	public addGlobalNamedArgs<
		TGlobalNamedArgs2 extends Record<string, NamedCmdArgOptions>
	>(
		args: TGlobalNamedArgs2
	): Cli<TCmdData, TGlobalNamedArgs & TGlobalNamedArgs2> {
		Object.assign(
			this._globalNamedArgs,
			mapObject(
				args,
				(val, key) =>
					new NamedCmdArg(
						key,
						val.type,
						val.description,
						val.shortName,
						val.excludeFromSchema
					)
			)
		);
		return this as any;
	}

	public addCmd<
		TNamedArgs extends Record<string, NamedCmdArgOptions> = {},
		TPositionalArgs extends PositionalCmdArg[] = []
	>(options: {
		name?: string | undefined;
		description?: string;
		positionalArgs?: TPositionalArgs;
		namedArgs?: TNamedArgs;

		getData: (
			args: NamedArgsToTypes<TNamedArgs> &
				PositionalArgsToTypes<TPositionalArgs> &
				NamedArgsToTypes<TGlobalNamedArgs>
		) => TCmdData;
	}): this {
		const cmd = new Cmd<TCmdData>(
			options.name,
			options.description,
			options.positionalArgs || [],
			Object.assign(
				{},
				options.namedArgs
					? mapObject(
							options.namedArgs,
							(val, key) =>
								new NamedCmdArg(
									key,
									val.type,
									val.description,
									val.shortName,
									val.excludeFromSchema
								)
					  )
					: {},
				this._globalNamedArgs
			),
			options.getData as any
		);
		if (this._cmds.find(c => c.name === cmd.name)) {
			throw new Error(
				`Command with name "${cmd.name}" has already been added.`
			);
		}
		this._cmds.push(cmd);

		return this;
	}

	public parse(
		argv: string[]
	): {
		parsedArgs: {
			readonly [TKey in keyof TGlobalNamedArgs]?: TGlobalNamedArgs[TKey]["type"]["T"];
		};
		dataFactory: (() => TCmdData) | undefined;
		selectedCmd: Cmd<TCmdData> | undefined;
		errors: Errors<
			| CmdParseError
			| CmdAssembleError
			| CmdInterpretError
			| CmdCliError
			| ArgParseError
		>;
	} {
		const parser = new CmdParser();
		const errors = new ErrorsImpl<
			| CmdParseError
			| CmdAssembleError
			| CmdInterpretError
			| CmdCliError
			| ArgParseError
		>();
		const parsedCmd = parser.parseArgs(argv);
		errors.addFrom(parsedCmd.errors);

		const {
			updatedParsedCmd,
			selectedCmdName: selectedSubCmd,
			selectedCmd: cmd,
		} = this.selectCmd(parsedCmd);

		if (!cmd) {
			errors.addError(
				selectedSubCmd
					? {
							kind: "CommandNotFound",
							command: selectedSubCmd,
							message: `There is no command with name "${selectedSubCmd}".`,
					  }
					: {
							kind: "NoCommandSpecified",
							message: `No command specified.`,
					  }
			);

			// We try to parse global named args to get at least anything.
			// This is important for the help command.
			const cmd = new Cmd(
				undefined,
				undefined,
				[],
				this.globalNamedArgs,
				undefined
			);
			const { parsedArgs } = cmd.parseArgs(parsedCmd);

			return {
				errors,
				parsedArgs: parsedArgs as any,
				dataFactory: undefined,
				selectedCmd: undefined,
			};
		}

		const result = cmd.parseArgs(updatedParsedCmd);

		if ("errors" in result) {
			errors.addFrom(result.errors);
		}

		return {
			errors,
			dataFactory: result.dataFactory,
			parsedArgs: result.parsedArgs as any,
			selectedCmd: cmd,
		};
	}

	private selectCmd(
		// e.g. "prin foo"
		parsedCmd: ParsedCmd
	): {
		// e.g. "foo"
		updatedParsedCmd: ParsedCmd;
		// e.g. "prin"
		selectedCmdName: string | undefined;
		// e.g. undefined, if there is no main command or command called `prin`
		selectedCmd: Cmd<TCmdData> | undefined;
	} {
		const subCmd =
			parsedCmd.prefixValue !== undefined &&
			this.findCmd(parsedCmd.prefixValue);
		if (subCmd) {
			return {
				updatedParsedCmd: new ParsedCmd(
					parsedCmd.parts.slice(1),
					parsedCmd.errors
				),
				selectedCmdName: parsedCmd.prefixValue,
				selectedCmd: subCmd,
			};
		} else if (this.mainCmd) {
			// The prefix value could still refer to a miss-spelled command.
			return {
				updatedParsedCmd: parsedCmd,
				selectedCmdName: undefined,
				selectedCmd: this.mainCmd,
			};
		} else {
			// No main cmd and either no prefix value,
			// or it does not refer to an existing command.
			return {
				updatedParsedCmd: parsedCmd,
				selectedCmd: undefined,
				selectedCmdName: parsedCmd.prefixValue,
			};
		}
	}

	getSerializer(): NamedSerializer<InstantiatedCmd<TCmdData>, any> {
		const serializer = sUnion(
			...this.cmds.map(c => c.getSerializer())
		).defineAs(cliNs("cmd"));
		return serializer;
	}
}

export type CmdCliError =
	| {
			kind: "CommandNotFound";
			message: string;
			command: string;
	  }
	| {
			kind: "NoCommandSpecified";
			message: string;
	  };
