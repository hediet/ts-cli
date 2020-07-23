import { Cli } from "./cli";
import {
	sTypePackage,
	sObject,
	sObjectProp,
	sString,
	sArrayOf,
} from "@hediet/semantic-json";
import {
	NamespacedName,
	namespace,
} from "@hediet/semantic-json/dist/src/NamespacedNamed";
import { SerializerSystem } from "@hediet/semantic-json/dist/src/serialization/SerializerSystem";

export interface CliSchema {
	mainType: NamespacedName;
	defaultType?: NamespacedName;
	typePackages: any[]; // TODO SerializerPackageDef[];
}

export const cliNs = namespace("hediet.de/cli");

const sNamespacedName = sObject({
	namespace: sString(),
	name: sString(),
}).refine<NamespacedName>({
	canSerialize: (ns): ns is NamespacedName => ns instanceof NamespacedName,
	fromIntermediate: (ns) => new NamespacedName(ns.namespace, ns.name),
	toIntermediate: (ns) => ({
		namespace: ns.namespace,
		name: ns.name,
	}),
});

export const sSchema = sObject({
	mainType: sNamespacedName,
	defaultType: sObjectProp({ serializer: sNamespacedName, optional: true }),
	typePackages: sArrayOf(sTypePackage),
});

export function cliToSchema(cli: Cli<any>): CliSchema {
	const ts = new SerializerSystem() as any;

	const serializer = cli.getSerializer();

	const tp = serializer.getType(ts);
	const typePackages = ts.getDefinedPackages();
	return {
		mainType: tp.namespacedName,
		typePackages,
	};
}

export class InstantiatedCmd<TCmdData> {
	constructor(public readonly getData: () => TCmdData) {}
}
