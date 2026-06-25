import jsonwebtoken from "jsonwebtoken";
import { secretKey } from "../commons/config.js";
import Errors from "../commons/errors.js";
import Account, { PERMISSIONS } from "../models/account.model.js";
import { answer } from "../controllers/ControllerAnswer.js";

const { verify, TokenExpiredError } = jsonwebtoken;

/**
 * Checks that the user is authenticated (JWT + XSRF)
 * Sets req.account with the current account
 */
export const verifyTokens = async (req, res, next) => {
  answer.reset();
  const timestamp = new Date().getTime();

  const accessToken = req.signedCookies.access_token;
  const xsrfToken = req.headers["x-xsrf-token"];

  if (!xsrfToken) {
    answer.set(Errors.getError(Errors.AUTH.NOT_AUTHORIZED));
    return next(answer);
  }
  if (!accessToken) {
    console.error("No JWT token is provided");
    answer.set(Errors.getError(Errors.AUTH.INVALID_JWT_TOKEN));
    return next(answer);
  }

  let decoded;
  try {
    decoded = verify(accessToken, secretKey);
  }
  catch (err) {
    if (err instanceof TokenExpiredError) {
      answer.set(Errors.getError(Errors.AUTH.INVALID_JWT_TOKEN));
    }
    else {
      answer.set(Errors.getError(Errors.AUTH.NOT_AUTHORIZED));
    }
    return next(answer);
  }

  if (xsrfToken !== decoded.xsrfToken) {
    console.error("XSRF token does not match the one in the JWT token");
    answer.set(Errors.getError(Errors.AUTH.NOT_AUTHORIZED));
    return next(answer);
  }

  const account = await Account.findOne({ _id: decoded._id, disabled: false });
  if (account === null) {
    answer.set(Errors.getError(Errors.AUTH.NOT_AUTHORIZED));
    return next(answer);
  }

  console.info(`VERIFY AUTHORISATIONS - done in ${new Date().getTime() - timestamp}ms`);
  req.account = account;
  return next();
};

/**
 * Returns a middleware that only accepts accounts having ALL the permissions in the bitmask
 */
export const requirePermissions = (mask) => (req, res, next) => {
  if (!req.account || (req.account.permissions & mask) !== mask) {
    answer.set(Errors.getError(Errors.AUTH.WRONG_PERMISSIONS));
    return next(answer);
  }
  return next();
};

export const requireAdmin = requirePermissions(PERMISSIONS.ADMIN);
