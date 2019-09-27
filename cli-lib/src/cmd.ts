import { PositionalParamType, NamedParamType } from "./param-types";

export interface PositionalCmdArg<TName extends string = string, T = unknown> {
	name: TName;
	description?: string;
	type: PositionalParamType<T>;
}

export interface NamedCmdArg<T = unknown> {
	type: NamedParamType<T>;
	description?: string;
}

export class Cmd<TCmdData> {
	constructor(
		public readonly description: string | undefined,
		private readonly positionalArgs: PositionalCmdArg[],
		private readonly namedArgs: Record<string, NamedCmdArg>,
		private readonly dataBuilder: (
			args: Record<string, unknown>
		) => TCmdData
	) {}
}
