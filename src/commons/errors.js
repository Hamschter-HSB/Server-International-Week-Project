const genericError = { number: 1, status: 500, message: "Unknown error" };

/* The `status` of each error is the HTTP status code used to answer the
 request (see getStatus + the error handler in app.js). It is NOT part of the
 JSON body returned to the client: a response only carries { error, data }.
 */
function findError(errorPool, number) {
  let err = undefined;
  for (let i = 0; i < errorPool.length; i++) {
    err = errorPool[i].find(e => e.number === number);
    if (err !== undefined) break;
  }
  if (err === undefined) { err = genericError; }
  return err;
}

export const AUTH_ERROR_CODES = {
  NO_LOGIN_PROVIDED: 1000,
  NO_PASSWORD_PROVIDED: 1001,
  NO_EMAIL_PROVIDED: 1002,
  INVALID_CREDENTIALS: 1003,
  INVALID_JWT_TOKEN: 1020,
  NOT_AUTHORIZED: 1021,
  WRONG_PERMISSIONS: 1041,
};

const authErrors = [
  { number: AUTH_ERROR_CODES.NO_LOGIN_PROVIDED, status: 400, message: "The login isn't defined or is invalid" },
  { number: AUTH_ERROR_CODES.NO_PASSWORD_PROVIDED, status: 400, message: "The password isn't defined or is invalid" },
  { number: AUTH_ERROR_CODES.NO_EMAIL_PROVIDED, status: 400, message: "The email isn't defined or is invalid" },
  { number: AUTH_ERROR_CODES.INVALID_CREDENTIALS, status: 401, message: "Credentials are invalid" },
  { number: AUTH_ERROR_CODES.INVALID_JWT_TOKEN, status: 400, message: "Invalid JWT token" },
  { number: AUTH_ERROR_CODES.NOT_AUTHORIZED, status: 403, message: "Not authorized" },
  { number: AUTH_ERROR_CODES.WRONG_PERMISSIONS, status: 403, message: "Wrong permissions" },
];

export const ACCOUNT_ERROR_CODES = {
  EMAIL_ALREADY_USED: 1152,
  PASSWORD_TOO_SHORT: 1155,
  CANNOT_FIND_USERNAME: 1162,
};

const accountErrors = [
  { number: ACCOUNT_ERROR_CODES.EMAIL_ALREADY_USED, status: 400, message: "Email already used" },
  { number: ACCOUNT_ERROR_CODES.PASSWORD_TOO_SHORT, status: 400, message: "Password too short" },
  { number: ACCOUNT_ERROR_CODES.CANNOT_FIND_USERNAME, status: 404, message: "Cannot find an account for this username" },
];

export const DATABASE_ERROR_CODES = {
  ERROR_WITH_THE_REQUEST: 1200,
  INVALID_TARGET: 1210,
  ALREADY_EXISTS: 1230,
  PERMISSION_DENIED: 1240,
};

const databaseErrors = [
  { number: DATABASE_ERROR_CODES.ERROR_WITH_THE_REQUEST, status: 500, message: "Error with the request" },
  { number: DATABASE_ERROR_CODES.INVALID_TARGET, status: 404, message: "The id does not exist" },
  { number: DATABASE_ERROR_CODES.ALREADY_EXISTS, status: 400, message: "Already exists" },
  { number: DATABASE_ERROR_CODES.PERMISSION_DENIED, status: 403, message: "Permission denied" },
];

export const REQ_ERROR_CODES = {
  INVALID_REQUEST: 2000,
  INVALID_PARAMETER: 2001,
  MISSING_PARAMETER: 2002,
};

const requestErrors = [
  { number: REQ_ERROR_CODES.INVALID_REQUEST, status: 400, message: "Invalid request" },
  { number: REQ_ERROR_CODES.INVALID_PARAMETER, status: 400, message: "Invalid parameter" },
  { number: REQ_ERROR_CODES.MISSING_PARAMETER, status: 400, message: "Missing parameter" },
];

const ERROR_POOL = [authErrors, accountErrors, databaseErrors, requestErrors];

// Response body for the client: { error, data } only (no HTTP status field).
export const getError = (number) => {
  const err = findError(ERROR_POOL, number);
  return { error: err.number, data: err.message };
};

// HTTP status code to answer with, looked up from the error catalog.
export const getStatus = (number) => findError(ERROR_POOL, number).status;

export default {
  AUTH: AUTH_ERROR_CODES,
  ACCOUNT: ACCOUNT_ERROR_CODES,
  DATABASE: DATABASE_ERROR_CODES,
  REQUEST: REQ_ERROR_CODES,
  getError,
  getStatus,
};
