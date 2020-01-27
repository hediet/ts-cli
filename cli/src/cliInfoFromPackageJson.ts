import { CliInfo } from "./runCliWithDefaultArgs";

export function cliInfoFromPackageJson(path: string): CliInfo {
	const pkgJson = require(path) as { name: string; version: string };
	return {
		appName: pkgJson.name,
		version: pkgJson.version || "0.0.1",
	};
}
