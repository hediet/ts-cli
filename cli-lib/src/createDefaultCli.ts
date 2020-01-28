import { Cli } from "./cli";

import { types } from "./param-types";
import { namedParam } from "./cmd-builder";

export function createDefaultCli<TData>() {
	return new Cli<TData>().addGlobalNamedParams({
		help: namedParam(types.booleanFlag, {
			shortName: "h",
			description: "Shows help.",
			excludeFromSchema: true,
		}),
		version: namedParam(types.booleanFlag, {
			shortName: "v",
			description: "Shows the version.",
			excludeFromSchema: true,
		}),
		"cmd::gui": namedParam(types.booleanFlag, {
			description: "Shows a gui.",
			excludeFromSchema: true,
		}),
		"cmd::schema": namedParam(types.booleanFlag, {
			description: "Shows the schema.",
			excludeFromSchema: true,
		}),
		"cmd::json-args": namedParam(types.string.withDefaultValue(undefined), {
			description: "Reads json input.",
			excludeFromSchema: true,
		}),
	});
}

export type CliDefaultGlobalArgs = ReturnType<
	typeof createDefaultCli
>["TGlobalNamedParams"];
