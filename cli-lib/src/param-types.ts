import {
	Serializer,
	sNumber,
	sLiteral,
	sString,
	sArrayOf,
	BaseSerializer,
	sUnion,
} from "@hediet/semantic-json";

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
	| TypeWithDefaultValue<T, T, TType>;

export interface ArgParseError {
	kind: "ArgParseError";
	message: string;
}

export type ParseResult<T> = { result: T } | { error: ArgParseError };

export abstract class ParamType<T> {
	public get T(): T {
		throw new Error();
	}

	public withDefaultValue<TDefault>(
		defaultValue: TDefault
	): TypeWithDefaultValue<T, TDefault, this> {
		return new TypeWithDefaultValue<T, TDefault, this>(this, defaultValue);
	}

	abstract parseStrings(values: string[]): ParseResult<T>;

	abstract toString(): string;

	public getRealType(): this {
		return this;
	}

	public abstract get serializer(): Serializer<T>;

	public itemToString(): string {
		return this.toString();
	}
}

export class TypeWithDefaultValue<T, TDefault, TType extends ParamType<T>> {
	public readonly kind = "TypeWithDefaultValue";

	public get T(): T | TDefault {
		throw new Error();
	}

	constructor(
		public readonly type: TType,
		public readonly defaultValue: TDefault
	) {}

	public getRealType(): TType {
		return this.type;
	}

	toString() {
		return this.type.toString();
	}

	public itemToString(): string {
		return this.type.itemToString();
	}

	public get serializer(): Serializer<T | TDefault> {
		return this.type.serializer as any;
	}
}

export abstract class NoValueParamType<T> extends ParamType<T> {
	public readonly kind = "NoValue";
	public abstract parse(): T;

	public parseStrings(values: string[]): { result: T } {
		return { result: this.parse() };
	}
}

export abstract class SingleValueParamType<T> extends ParamType<T> {
	public readonly kind = "SingleValue";
	public abstract parse(val: string): ParseResult<T>;

	public parseStrings(values: string[]): ParseResult<T> {
		return this.parse(values[0]);
	}
}

export abstract class MultiValueParamType<T> extends ParamType<T> {
	public readonly kind = "MultiValue";
	public abstract parse(val: string[]): ParseResult<T>;

	public parseStrings(values: string[]): ParseResult<T> {
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

	public get serializer(): Serializer<true> {
		return sLiteral(true);
	}
}

export class StringSerializerParamType<T> extends SingleValueParamType<T> {
	constructor(
		public readonly serializer: Serializer<T>,
		private readonly name: string
	) {
		super();
	}

	public parse(value: string): ParseResult<T> {
		const r = this.serializer.deserialize(value);
		if (!r.hasErrors) {
			return { result: r.value };
		} else {
			const message = r.errors.map((e) => e.message).join("\n");
			return { error: { kind: "ArgParseError", message } };
		}
	}

	toString() {
		return this.name;
	}
}

export class NumberSerializerParamType<T> extends SingleValueParamType<T> {
	constructor(
		public readonly serializer: Serializer<T>,
		private readonly name: string
	) {
		super();
	}

	public parse(value: string): ParseResult<T> {
		const numberVal = parseFloat(value);
		if (Number.isNaN(numberVal)) {
			return {
				error: {
					kind: "ArgParseError",
					message: `String "${value}" is not a valid float.`,
				},
			};
		}

		const r = this.serializer.deserialize(numberVal);
		if (!r.hasErrors) {
			return { result: r.value };
		} else {
			const message = r.errors.map((e) => e.message).join("\n");
			return { error: { kind: "ArgParseError", message } };
		}
	}

	toString() {
		return this.name;
	}
}

export class ChoiceParamType<
	T extends string
> extends StringSerializerParamType<T> {
	constructor(public readonly choices: T[]) {
		super(sUnion(choices.map((c) => sLiteral(c))), choices.join("|"));
	}
}

export class ArrayType<TItem> extends MultiValueParamType<TItem[]> {
	constructor(public readonly itemType: SingleValueParamType<TItem>) {
		super();
	}

	parse(items: string[]): ParseResult<TItem[]> {
		const result = new Array<TItem>();
		for (const i of items) {
			const r = this.itemType.parse(i);
			if ("result" in r) {
				result.push(r.result);
			} else {
				return r;
			}
		}
		return { result };
	}

	toString() {
		return `${this.itemType.toString()}[]`;
	}

	itemToString() {
		return this.itemType.toString();
	}

	public get serializer(): Serializer<TItem[]> {
		return sArrayOf(this.itemType.serializer);
	}
}

export const types = {
	booleanFlag: new TrueParamType().withDefaultValue(false),
	int: new NumberSerializerParamType(sNumber(), "int"),
	number: new NumberSerializerParamType(sNumber(), "number"),
	string: new StringSerializerParamType(sString(), "string"),
	choice: <T extends string>(...choices: T[]) => new ChoiceParamType(choices),
	arrayOf: <T>(itemType: SingleValueParamType<T>) =>
		new ArrayType<T>(itemType),
	/*
	TODO

	file: (options: { relativeTo?: string }) =>
		new SingleValueParamType(val => val),
	*/
};
