export abstract class Errors<TError extends BaseError> {
	public static single<TError extends BaseError>(
		error: TError
	): Errors<TError> {
		const impl = new ErrorsImpl<TError>();
		impl.addError(error);
		return impl;
	}

	protected readonly _errors: TError[] = [];
	public get errors(): ReadonlyArray<TError> {
		return this._errors;
	}

	public get hasErrors(): boolean {
		return this._errors.length > 0;
	}

	public toString() {
		return this.errors.map(e => e.message).join("\n");
	}
}

export class ErrorsImpl<TError extends BaseError> extends Errors<TError> {
	public addError(err: TError): void {
		this._errors.push(err);
	}

	public addFrom(errors: Errors<TError>): void {
		this._errors.push(...errors.errors);
	}
}

export interface BaseError {
	kind: string;
	message: string;
}
