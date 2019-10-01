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

export class Cli<
	TCmdData,
	TGlobalNamedArgs extends Record<string, NamedCmdArgOptions> = {}
> {
	public readonly cmds: Cmd<TCmdData>[] = [];
	public readonly globalNamedArgs: Record<string, NamedCmdArg> = {};

	public addGlobalNamedArgs<
		TGlobalNamedArgs2 extends Record<string, NamedCmdArgOptions>
	>(
		args: TGlobalNamedArgs2
	): Cli<TCmdData, TGlobalNamedArgs & TGlobalNamedArgs2> {
		Object.assign(
			this.globalNamedArgs,
			mapObject(
				args,
				(val, key) =>
					new NamedCmdArg(
						key,
						val.type,
						val.description,
						val.shortName
					)
			)
		);
		return this as any;
	}

	public addSubCmd<
		TNamedArgs extends Record<string, NamedCmdArgOptions> = {},
		TPositionalArgs extends PositionalCmdArg[] = []
	>(options: {
		name: string;
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
									val.shortName
								)
					  )
					: {},
				this.globalNamedArgs
			),
			options.getData as any
		);
		if (this.cmds.find(c => c.name === cmd.name)) {
			throw new Error(
				`Command with name "${cmd.name}" has already been added.`
			);
		}
		this.cmds.push(cmd);

		return this;
	}

	public parse(
		argv: string[]
	):
		| { data: TCmdData }
		| {
				errors: Errors<
					| CmdParseError
					| CmdAssembleError
					| CmdInterpretError
					| CmdCliError
				>;
		  } {
		const parser = new CmdParser();
		const errors = new ErrorsImpl<
			CmdParseError | CmdAssembleError | CmdInterpretError | CmdCliError
		>();
		const parsedCmd = parser.parseArgs(argv);
		errors.addFrom(parsedCmd.errors);
		if (errors.hasErrors) {
			return { errors };
		}

		const result = this.processParsedCmd(parsedCmd);
		if ("errors" in result) {
			errors.addFrom(result.errors);
			return { errors };
		}
		return result;
	}

	protected processParsedCmd(
		parsedCmd: ParsedCmd
	):
		| { data: TCmdData }
		| {
				errors: Errors<
					| CmdParseError
					| CmdAssembleError
					| CmdInterpretError
					| CmdCliError
				>;
		  } {
		let cmd = this.cmds.find(c => c.name === undefined);
		const firstCmd = parsedCmd.parts[0];
		let selectedSubCmd =
			firstCmd && firstCmd.kind === "Value" ? firstCmd.value : undefined;
		if (selectedSubCmd) {
			const subCmd = this.cmds.find(c => c.name === selectedSubCmd);
			if (subCmd) {
				cmd = subCmd;
				parsedCmd.parts.shift();
			}
		}

		if (!cmd) {
			return {
				errors: Errors.single(
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
				),
			};
		}

		return this.processParsedCmdForSelectedCmd(cmd, parsedCmd);
	}

	protected processParsedCmdForSelectedCmd(
		cmd: Cmd<TCmdData>,
		parsedCmd: ParsedCmd
	):
		| { data: TCmdData }
		| {
				errors: Errors<
					CmdParseError | CmdAssembleError | CmdInterpretError
				>;
		  } {
		const data = cmd.parseArgsAndGetData(parsedCmd);
		return data;
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
