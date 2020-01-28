import {
	NamedCmdParamOptions,
	NamedParamsToTypes,
	PositionalParamsToTypes,
} from "./cmd-builder";
import {
	Cmd,
	CmdInterpretError,
	PositionalCmdParam,
	NamedCmdParam,
} from "./cmd";
import { CmdParser, ParsedCmd, CmdParseError } from "./parser";
import { Errors, ErrorsImpl } from "./errors";
import { CmdAssembleError } from "./assembler";
import { mapObject } from "./utils";
import { sUnion, NamedSerializer } from "@hediet/semantic-json";
import { InstantiatedCmd, cliNs } from "./schema";
import { ArgParseError } from "./param-types";

export class Cli<
	TCmdData,
	TGlobalNamedParams extends Record<string, NamedCmdParamOptions> = {}
> {
	public get TCmdData(): TCmdData {
		throw new Error("Do not access this field on runtime");
	}

	public get TGlobalNamedParams(): TGlobalNamedParams {
		throw new Error("Do not access this field on runtime");
	}

	private readonly _cmds: Cmd<TCmdData>[] = [];
	private readonly _globalNamedParams: Record<string, NamedCmdParam> = {};

	public get mainCmd(): Cmd<TCmdData> | undefined {
		return this.findCmd(undefined);
	}

	public findCmd(name: string | undefined): Cmd<TCmdData> | undefined {
		return this._cmds.find(c => c.name === name);
	}

	public get cmds(): readonly Cmd<TCmdData>[] {
		return this._cmds;
	}

	public get globalNamedParams(): { readonly [name: string]: NamedCmdParam } {
		return this._globalNamedParams;
	}

	public addGlobalNamedParams<
		TNewGlobalNamedParams extends Record<string, NamedCmdParamOptions>
	>(
		args: TNewGlobalNamedParams
	): Cli<TCmdData, TGlobalNamedParams & TNewGlobalNamedParams> {
		Object.assign(
			this._globalNamedParams,
			mapObject(
				args,
				(val, key) =>
					new NamedCmdParam(
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
		TNamedParams extends Record<string, NamedCmdParamOptions> = {},
		TPositionalParams extends PositionalCmdParam[] = []
	>(options: {
		name?: string | undefined;
		description?: string;
		positionalParams?: TPositionalParams;
		namedParams?: TNamedParams;

		getData: (
			args: NamedParamsToTypes<TNamedParams> &
				PositionalParamsToTypes<TPositionalParams> &
				NamedParamsToTypes<TGlobalNamedParams>
		) => TCmdData;
	}): this {
		const cmd = new Cmd<TCmdData>(
			options.name,
			options.description,
			options.positionalParams || [],
			Object.assign(
				{},
				options.namedParams
					? mapObject(
							options.namedParams,
							(val, key) =>
								new NamedCmdParam(
									key,
									val.type,
									val.description,
									val.shortName,
									val.excludeFromSchema
								)
					  )
					: {},
				this._globalNamedParams
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
			readonly [TKey in keyof TGlobalNamedParams]?: TGlobalNamedParams[TKey]["type"]["T"];
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
				this.globalNamedParams,
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
