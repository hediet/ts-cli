import { Cli, CmdCliError, CliOptions } from "./cli";
import { ParsedCmd, CmdParseError } from "./parser";
import { Cmd, CmdInterpretError, NamedCmdArg } from "./cmd";
import { Errors } from "./errors";
import { CmdAssembleError } from "./assembler";
import { types } from "./param-types";
import { NamedCmdArgOptions } from "./cmd-builder";

export type ExtendedData<TData> =
	| TData
	| {
			isExtendedCmd: true;
			kind: "helpCmd";
			cmdName?: string;
			cmd?: Cmd<any>;
			errors?: Errors<
				| CmdParseError
				| CmdAssembleError
				| CmdInterpretError
				| CmdCliError
			>;
	  }
	| { isExtendedCmd: true; kind: "versionCmd" }
	| { isExtendedCmd: true; kind: "guiCmd" }
	| { isExtendedCmd: true; kind: "schemaCmd" };

export class ExtendedCli<
	TData,
	TSharedNamedArgs extends Record<string, NamedCmdArgOptions>
> extends Cli<ExtendedData<TData>, TSharedNamedArgs> {
	constructor(options: CliOptions<ExtendedData<TData>, TSharedNamedArgs>) {
		super(options);

		function prepareCmd(cmd: Cmd<any>) {
			cmd.namedArgs.help = new NamedCmdArg(
				"help",
				types.booleanFlag,
				"Shows the help.",
				"h"
			);
			cmd.namedArgs.version = new NamedCmdArg(
				"version",
				types.booleanFlag,
				"Shows the version.",
				"v"
			);
		}

		if (this.mainCmd) {
			prepareCmd(this.mainCmd);
		}
		for (const cmd of Object.values(this.subCmds)) {
			prepareCmd(cmd);
		}
	}

	public parse(
		argv: string[]
	):
		| { data: ExtendedData<TData> }
		| {
				errors: Errors<
					| CmdParseError
					| CmdAssembleError
					| CmdInterpretError
					| CmdCliError
				>;
		  } {
		const result = super.parse(argv);

		if ("errors" in result) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "helpCmd",
					errors: result.errors,
				},
			};
		} else {
			return result;
		}
	}

	protected processParsedCmdForSelectedCmd(
		cmdName: string | undefined,
		cmd: Cmd<ExtendedData<TData>>,
		parsedCmd: ParsedCmd
	):
		| { data: ExtendedData<TData> }
		| {
				errors: Errors<
					CmdParseError | CmdAssembleError | CmdInterpretError
				>;
		  } {
		if (parsedCmd.findNamedPart({ name: "help", short: "h" })) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "helpCmd",
					cmdName,
					cmd,
				},
			};
		}
		if (parsedCmd.findNamedPart({ name: "version", short: "v" })) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "versionCmd",
				},
			};
		}
		if (parsedCmd.findNamedPart({ name: "cmd::gui" })) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "guiCmd",
				},
			};
		}
		if (parsedCmd.findNamedPart({ name: "cmd::schema" })) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "schemaCmd",
				},
			};
		}

		const result = super.processParsedCmdForSelectedCmd(
			cmdName,
			cmd,
			parsedCmd
		);

		if ("errors" in result) {
			return {
				data: {
					isExtendedCmd: true,
					kind: "helpCmd",
					cmdName,
					cmd,
					errors: result.errors,
				},
			};
		} else {
			return result;
		}
	}
}
