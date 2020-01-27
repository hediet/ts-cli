import {
	contract,
	requestContract,
	types,
	notificationContract,
	JSONValue,
} from "@hediet/typed-json-rpc";
import { sSchema } from "@hediet/cli-lib";

export const uiContract = contract({
	client: {},
	server: {
		getSchema: requestContract({
			// TODO properly type this when typed-json-rpc loses JSON type bound
			result: types.any as types.Type<
				/*typeof sSchema["TSource"]*/ JSONValue
			>,
		}),
		run: notificationContract({
			params: types.type({
				args: types.any,
			}),
		}),
	},
});
