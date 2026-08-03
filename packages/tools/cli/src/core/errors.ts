/** An error whose message is meant for the user, printed without a stack. */
export class FacetError extends Error {}

/** A command whose contract is settled but whose body is not written yet. */
export class NotImplementedError extends FacetError {
  constructor(what: string) {
    super(`\`${what}\` is not implemented yet.`);
  }
}

export function isUserFacing(error: unknown): error is FacetError {
  return error instanceof FacetError;
}
