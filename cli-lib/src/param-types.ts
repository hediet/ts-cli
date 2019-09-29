export type PositionalParamType<T> = TypeWithDefaultValueHelper<
	T,
	SingleValueParamType<T> | MultiValueParamType<T>
>;

export type NamedParamType<T> = TypeWithDefaultValueHelper<
	T,
	NoValueParamType<T> | SingleValueParamType<T> | MultiValueParamType<T>
>;

type TypeWithDefaultValueHelper<T, TType extends ParamType<T>> =
	| TType
	| TypeWithDefaultValue<T, TType>;

export class TypeWithDefaultValue<T, TType extends ParamType<T>> {
	public readonly kind = "TypeWithDefaultValue";

	public get T(): T {
		throw new Error();
	}

	constructor(public readonly type: TType, public readonly defaultValue: T) {}

	public getRealType(): TType {
		return this.type;
	}

	toString() {
		return this.type.toString();
	}
}

export abstract class ParamType<T> {
	public get T(): T {
		throw new Error();
	}

	public withDefaultValue<TDefault>(
		defaultValue: TDefault
	): TypeWithDefaultValue<T | TDefault, this> {
		return new TypeWithDefaultValue<T | TDefault, this>(this, defaultValue);
	}

	abstract parseStrings(values: string[]): T;

	public getRealType(): this {
		return this;
	}
}

export abstract class NoValueParamType<T> extends ParamType<T> {
	public readonly kind = "NoValue";
	public abstract parse(): T;

	public parseStrings(values: string[]): T {
		return this.parse();
	}
}

export abstract class SingleValueParamType<T> extends ParamType<T> {
	public readonly kind = "SingleValue";
	public abstract parse(val: string): T;

	public parseStrings(values: string[]): T {
		return this.parse(values[0]);
	}
}

export abstract class MultiValueParamType<T> extends ParamType<T> {
	public readonly kind = "MultiValue";
	public abstract parse(val: string[]): T;

	public parseStrings(values: string[]): T {
		return this.parse(values);
	}
}

export class TrueParamType extends NoValueParamType<true> {
	parse(): true {
		return true;
	}

	toString() {
		return "true";
	}
}

export class IntParamType extends SingleValueParamType<number> {
	parse(value: string) {
		return parseInt(value, 10);
	}

	toString() {
		return "int";
	}
}

export class NumberParamType extends SingleValueParamType<number> {
	parse(value: string) {
		return parseFloat(value);
	}

	toString() {
		return "number";
	}
}

export class StringParamType extends SingleValueParamType<string> {
	parse(value: string): string {
		return value;
	}

	toString() {
		return "string";
	}
}

export class ChoiceParamType<T extends string> extends SingleValueParamType<T> {
	constructor(public readonly choices: T[]) {
		super();
	}

	parse(value: string): T {
		return value as T;
	}

	toString() {
		return this.choices.join(" | ");
	}
}

export class ArrayType<TItem> extends MultiValueParamType<TItem[]> {
	constructor(public readonly itemType: SingleValueParamType<TItem>) {
		super();
	}

	parse(items: string[]): TItem[] {
		return items.map(item => this.itemType.parse(item));
	}

	toString() {
		return `${this.itemType.toString()}[]`;
	}
}

export const types = {
	booleanFlag: new TrueParamType().withDefaultValue(false),
	int: new IntParamType(),
	number: new NumberParamType(),
	string: new StringParamType(),
	choice: <T extends string>(...choices: T[]) => new ChoiceParamType(choices),
	arrayOf: <T>(itemType: SingleValueParamType<T>) =>
		new ArrayType<T>(itemType),
	/*file: (options: { relativeTo?: string }) =>
		new SingleValueParamType(val => val),*/
};
