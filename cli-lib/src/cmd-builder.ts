import { NamedParamType, PositionalParamType } from "./param-types";
import { PositionalCmdParam } from "./cmd";

export interface NamedCmdParamOptions<T = unknown> {
	type: NamedParamType<T>;
	description?: string;
	shortName?: string;
	excludeFromSchema: boolean;
}

export type NamedParamsToTypes<
	TArgs extends Record<string, NamedCmdParamOptions>
> = {
	[TKey in keyof TArgs]: TArgs[TKey]["type"]["T"];
};

export type UnionToIntersection<U> = (U extends any
	? (k: U) => void
	: never) extends (k: infer I) => void
	? I
	: never;
export type Merge<T> = UnionToIntersection<T[keyof T]>;
export type PositionalParamsToTypes<TArgs extends PositionalCmdParam[]> = Merge<
	{
		[TKey in keyof TArgs & number]: {
			[TKey2 in TArgs[TKey]["name"]]: TArgs[TKey]["type"]["T"];
		};
	}
>;

/**
 * Specifies a named parameter.
 * The key this field is assigned to is used as name.
 * @param type The type of the parameter.
 */
export function namedParam<T>(
	type: NamedParamType<T>,
	options: {
		description?: string;
		shortName?: string;
		excludeFromSchema?: boolean;
	}
): NamedCmdParamOptions<T> {
	return {
		type,
		description: options && options.description,
		shortName: options && options.shortName,
		excludeFromSchema: !!options.excludeFromSchema,
	};
}

/**
 * Specifies a positional parameter.
 * @param name The name used for accessing the value and for documentation.
 * @param type The type of the parameter.
 */
export function positionalParam<TName extends string, T>(
	name: TName,
	type: PositionalParamType<T>,
	options?: { description?: string }
): PositionalCmdParam<TName, T> {
	return {
		name,
		type,
		description: options && options.description,
	};
}
