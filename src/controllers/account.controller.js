import Errors from "../commons/errors.js";
import Account from "../models/account.model.js";
import { answer } from "./ControllerAnswer.js";

/**
 * Changes the password of the authenticated account (self-service, no admin right).
 * The current account (req.account, set by verifyTokens) chooses a new password.
 * The model's pre-save hook hashes it.
 */
export const changeOwnPassword = async (req, res, next) => {
  answer.reset();

  const password = req.body?.password;
  if (!password) {
    answer.set(Errors.getError(Errors.AUTH.NO_PASSWORD_PROVIDED));
    return next(answer);
  }
  if (password.length < 8) {
    answer.set(Errors.getError(Errors.ACCOUNT.PASSWORD_TOO_SHORT));
    return next(answer);
  }

  try {
    const account = req.account; // already loaded by verifyTokens
    account.password = password;
    await account.save();
    answer.setPayload(account);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};

/**
 * Changes the email of the authenticated account (self-service, no admin right).
 */
export const changeOwnEmail = async (req, res, next) => {
  answer.reset();

  const email = req.body?.email;
  if (!email) {
    answer.set(Errors.getError(Errors.AUTH.NO_EMAIL_PROVIDED));
    return next(answer);
  }

  try {
    if (await Account.exists({ email: email.toLowerCase(), _id: { $ne: req.account._id }, disabled: false })) {
      answer.set(Errors.getError(Errors.ACCOUNT.EMAIL_ALREADY_USED));
      return next(answer);
    }
    const account = req.account; // already loaded by verifyTokens
    account.email = email;
    await account.save();
    answer.setPayload(account);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};
