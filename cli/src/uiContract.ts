import {
	contract,
	requestContract,
	types,
	notification,
	notificationContract,
	JSONValue,
} from "@hediet/typed-json-rpc";
import { sSchema } from "@hediet/cli-lib";

export const uiContract = contract({
	client: {},
	server: {
		getSchema: requestContract({
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
