import { NamedParamType, PositionalParamType } from "./param-types";
import { PositionalCmdArg } from "./cmd";

export interface NamedCmdArgOptions<T = unknown> {
	type: NamedParamType<T>;
	description?: string;
	shortName?: string;
	excludeFromSchema: boolean;
}

export type NamedArgsToTypes<
	TArgs extends Record<string, NamedCmdArgOptions>
> = {
	[TKey in keyof TArgs]: TArgs[TKey]["type"]["T"];
};

export type UnionToIntersection<U> = (U extends any
	? (k: U) => void
	: never) extends (k: infer I) => void
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

export function namedArg<T>(
	type: NamedParamType<T>,
	options: {
		description?: string;
		shortName?: string;
		excludeFromSchema?: boolean;
	}
): NamedCmdArgOptions<T> {
	return {
		type,
		description: options && options.description,
		shortName: options && options.shortName,
		excludeFromSchema: !!options.excludeFromSchema,
	};
}

export function positionalArg<TName extends string, T>(
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
