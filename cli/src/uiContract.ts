import {
	contract,
	requestContract,
	types,
	notification,
	notificationContract,
} from "@hediet/typed-json-rpc";

export const uiContract = contract({
	client: {},
	server: {
		getSchema: requestContract({
			result: types.type({}),
		}),
		run: notificationContract({
			params: types.type({}),
		}),
	},
});
