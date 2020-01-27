import { Cli } from "./cli";
import {
	sTypePackage,
	TypePackageDef,
	NamespacedName,
	TypeSystem,
	sObject,
	field,
	sString,
	namespace,
	sArray,
} from "@hediet/semantic-json";
import { deserializationValue } from "@hediet/semantic-json";

export interface CliSchema {
	mainType: NamespacedName;
	defaultType?: NamespacedName;
	typePackages: TypePackageDef[];
}

export const cliNs = namespace("hediet.de/cli");

const sNamespacedName = sObject({
	properties: {
		namespace: sString,
		name: sString,
	},
}).refine<NamespacedName>({
	canSerialize: (ns): ns is NamespacedName => ns instanceof NamespacedName,
	deserialize: ns =>
		deserializationValue(new NamespacedName(ns.namespace, ns.name)),
	serialize: ns => ({
		namespace: ns.namespace,
		name: ns.name,
	}),
});

export const sSchema = sObject({
	properties: {
		mainType: sNamespacedName,
		defaultType: field({ serializer: sNamespacedName, optional: true }),
		typePackages: sArray(sTypePackage),
	},
});

export function cliToSchema(cli: Cli<any>): CliSchema {
	const ts = new TypeSystem();

	const serializer = cli.getSerializer();

	const tp = serializer.getType(ts);
	const typePackages = ts.definedPackages();
	return {
		mainType: tp.namespacedName,
		typePackages,
	};
}

export class InstantiatedCmd<TCmdData> {
	constructor(public readonly getData: () => TCmdData) {}
}
