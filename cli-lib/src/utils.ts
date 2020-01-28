export function mapObject<TObj extends {}, TResult>(
	obj: TObj,
	map: (item: TObj[keyof TObj], key: string) => TResult
): Record<keyof TObj, TResult> {
	const result: Record<keyof TObj, TResult> = {} as any;

	for (const [key, value] of Object.entries(obj)) {
		result[key as keyof TObj] = map(value as any, key);
	}

	return result;
}

export function fromEntries<TKey extends string, TValue>(
	iterable: [TKey, TValue][]
): { [TKey2 in TKey]: TValue } {
	return [...iterable].reduce((obj, [key, val]) => {
		obj[key] = val;
		return obj;
	}, {} as { [TKey2 in TKey]: TValue });
}
