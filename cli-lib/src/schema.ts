import { Cli } from ".";
import { Cmd, NamedCmdArg, PositionalCmdArg } from "./cmd";
import { NamedParamType } from "./param-types";

export interface CliSchema {
	cmds: CmdSchema[];
}

export interface CmdSchema {
	name: string | undefined;
	description: string | undefined;
	positionalArgs: PositionalArgSchema[];
	namedArgs: NamedArgSchema[];
}

export interface PositionalArgSchema {
	name: string;
	description: string | undefined;
	type: ArgTypeSchema;
}

export interface NamedArgSchema {
	name: string;
	description: string | undefined;
	type: ArgTypeSchema;
}

export interface ArgTypeSchema {
	name: string;
	defaultValue: unknown;
}

export function cliToSchema(cli: Cli<any>): CliSchema {
	return {
		cmds: cli.cmds.map(c => cmdToSchema(c)),
	};
}

function cmdToSchema(cmd: Cmd<any>): CmdSchema {
	return {
		name: cmd.name,
		description: cmd.description,
		positionalArgs: cmd.positionalArgs.map(a => positionalArgToSchema(a)),
		namedArgs: Object.values(cmd.namedArgs).map(a => namedArgToSchema(a)),
	};
}

function positionalArgToSchema(arg: PositionalCmdArg): PositionalArgSchema {
	return {
		name: arg.name,
		description: arg.description,
		type: typeToSchema(arg.type),
	};
}

function namedArgToSchema(arg: NamedCmdArg<any>): NamedArgSchema {
	return {
		name: arg.name,
		description: arg.description,
		type: typeToSchema(arg.type),
	};
}

function typeToSchema(type: NamedParamType<any>): ArgTypeSchema {
	return {
		name: type.toString(),
		defaultValue: undefined,
	};
}
