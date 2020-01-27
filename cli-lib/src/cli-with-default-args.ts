import { Cli } from "./cli";

import { types } from "./param-types";
import { namedArg } from "./cmd-builder";

export function createCliWithDefaultArgs<TData>() {
	return new Cli<TData>().addGlobalNamedArgs({
		help: namedArg(types.booleanFlag, {
			shortName: "h",
			description: "Shows help.",
			excludeFromSchema: true,
		}),
		version: namedArg(types.booleanFlag, {
			shortName: "v",
			description: "Shows the version.",
			excludeFromSchema: true,
		}),
		"cmd::gui": namedArg(types.booleanFlag, {
			description: "Shows a gui.",
			excludeFromSchema: true,
		}),
		"cmd::schema": namedArg(types.booleanFlag, {
			description: "Shows the schema.",
			excludeFromSchema: true,
		}),
		"cmd::json-args": namedArg(types.string.withDefaultValue(undefined), {
			description: "Reads json input.",
			excludeFromSchema: true,
		}),
	});
}

export type CliDefaultGlobalArgs = ReturnType<
	typeof createCliWithDefaultArgs
>["TGlobalNamedArgs"];
