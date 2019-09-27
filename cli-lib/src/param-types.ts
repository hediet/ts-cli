export type PositionalParamType<T> =
	| SingleValueParamType<T>
	| MultiValueParamType<T>;

export type NamedParamType<T> =
	| NoValueParamType<T>
	| SingleValueParamType<T>
	| MultiValueParamType<T>;

export interface NoValueParamType<T> {
	T: T;
	kind: "NoValue";
	parse(isPresent: boolean): T;
}
export function createNoValueParamType<T>(
	parse: NoValueParamType<T>["parse"]
): NoValueParamType<T> {
	return {
		T: (null as any) as T,
		kind: "NoValue",
		parse,
	};
}

export interface SingleValueParamType<T> {
	T: T;
	kind: "SingleValue";
	parse(val: string): T;
}
export function createSingleValueParamType<T>(
	parse: SingleValueParamType<T>["parse"]
): SingleValueParamType<T> {
	return {
		T: (null as any) as T,
		kind: "SingleValue",
		parse,
	};
}

export interface MultiValueParamType<T> {
	T: T;
	kind: "MultiValue";
	parse(val: string[]): T;
}
export function createMultiValueParamType<T>(
	parse: MultiValueParamType<T>["parse"]
): MultiValueParamType<T> {
	return {
		T: (null as any) as T,
		kind: "MultiValue",
		parse,
	};
}

export const types = {
	booleanFlag: createNoValueParamType(isPresent => isPresent),
	int: createSingleValueParamType(val => parseInt(val, 10)),
	number: createSingleValueParamType(val => parseFloat(val)),
	string: createSingleValueParamType(val => val),
	file: (options: { relativeTo?: string }) =>
		createSingleValueParamType(val => val),
};
