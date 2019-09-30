import { NamedParamType, PositionalParamType } from "./param-types";
import { Cmd, NamedCmdArg, PositionalCmdArg } from "./cmd";
import { mapObject } from "./utils";

export interface NamedCmdArgOptions<T = unknown> {
	type: NamedParamType<T>;
	description?: string;
	shortName?: string;
}

export type NamedArgsToTypes<
	TArgs extends Record<string, NamedCmdArgOptions>
> = {
	[TKey in keyof TArgs]: TArgs[TKey]["type"]["T"];
};

export type UnionToIntersection<U> = (U extends any
	? (k: U) => void
	: never) extends ((k: infer I) => void)
	? I
	: never;
export type Merge<T> = UnionToIntersection<T[keyof T]>;
export type PositionalArgsToTypes<TArgs extends PositionalCmdArg[]> = Merge<
	{
		[TKey in keyof TArgs & number]: {
			[TKey2 in TArgs[TKey]["name"]]: TArgs[TKey]["type"]["T"];
		};
	}
>;

function namedArgCtor<T>(
	type: NamedParamType<T>,
	options: { description?: string; shortName?: string }
): NamedCmdArgOptions<T> {
	return {
		type,
		description: options && options.description,
		shortName: options && options.shortName,
	};
}

export class NamedArgFactory {
	public readonly namedArg = namedArgCtor;
}

export class CmdFactory<
	TCmdData,
	TSharedNamedArgs extends Record<string, NamedCmdArgOptions>
> {
	cmd<
		TNamedArgs extends Record<string, NamedCmdArgOptions> = {},
		TPositionalArgs extends PositionalCmdArg[] = []
	>(
		options: {
			description?: string;
			positionalArgs?: TPositionalArgs;
			namedArgs?: TNamedArgs;
		},
		dataBuilder: (
			args: NamedArgsToTypes<TNamedArgs> &
				PositionalArgsToTypes<TPositionalArgs> &
				NamedArgsToTypes<TSharedNamedArgs>
		) => TCmdData
	): Cmd<TCmdData> {
		return new Cmd(
			options.description,
			options.positionalArgs || [],
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
			dataBuilder as any
		);
	}

	public readonly namedArg = namedArgCtor;

	positionalArg<TName extends string, T>(
		name: TName,
		type: PositionalParamType<T>,
		options?: { description?: string }
	): PositionalCmdArg<TName, T> {
		return {
			name,
			type,
			description: options && options.description,
		};
	}
}
