import bcryptjs from 'bcryptjs';
import jsonwebtoken from "jsonwebtoken";
import { randomBytes } from "crypto";
import {
  jwtExpiration,
  secretKey,
} from "../commons/config.js";
import { answer } from "./ControllerAnswer.js";
import Account from "../models/account.model.js";
import Errors from "../commons/errors.js";

const { sign } = jsonwebtoken;
const { compareSync } = bcryptjs;

/**
 * Sign in
 * Issues a signed JWT cookie (`access_token`) + an XSRF token returned to the
 * client. No refresh token: the session lasts as long as the JWT.
 */
export const login = async (req, res, next) => {
  if (!req.body?.username) {
    answer.set(Errors.getError(Errors.AUTH.NO_LOGIN_PROVIDED));
    return next(answer);
  }
  if (!req.body?.password) {
    answer.set(Errors.getError(Errors.AUTH.NO_PASSWORD_PROVIDED));
    return next(answer);
  }
  const username = req.body.username.toLowerCase();
  const password = req.body.password;
  answer.reset();
  const timestamp = new Date().getTime();

  const account = await Account.findOne({ username, disabled: false });

  if (!account) {
    console.error("Account does not exist");
    answer.set(Errors.getError(Errors.AUTH.INVALID_CREDENTIALS));
    return next(answer);
  }

  if (!account.password || !compareSync(password, account.password)) {
    console.error("Password is incorrect");
    answer.set(Errors.getError(Errors.AUTH.INVALID_CREDENTIALS));
    return next(answer);
  }

  const xsrfToken = randomBytes(64).toString("hex");
  const jwtToken = sign({ _id: account._id.toString(), xsrfToken }, secretKey, {
    expiresIn: jwtExpiration,
  });

  console.info(`LOGIN - done in ${new Date().getTime() - timestamp}ms`);
  res.cookie("access_token", jwtToken, {
    maxAge: jwtExpiration * 1000,
    httpOnly: true,
    secure: true,
    signed: true,
    partitioned: true,
    sameSite: "none",
  });

  answer.setPayload({
    xsrfToken,
    account: account.toJSON(),
  });
  res.status(200).send(answer);
};

/**
 * Sign out: clears the JWT cookie.
 */
export const logout = async (req, res, _next) => {
  answer.reset();
  const timestamp = new Date().getTime();

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    signed: true,
    partitioned: true,
    sameSite: "none",
  });

  console.info(`LOGOUT - done in ${new Date().getTime() - timestamp}ms`);
  answer.setPayload(true);
  res.status(200).send(answer);
};
