import bcryptjs from 'bcryptjs';
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const PERMISSIONS = {
  NONE: 0,
  REGISTERED: 1,   // standard "registered" user
  ADMIN: 128,
  ANY: 255,        // used to bypass permission checks on the logic side
};

const AccountSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
  },
  permissions: {
    type: Number,
    default: PERMISSIONS.REGISTERED,
  },
  disabled: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { versionKey: false });

AccountSchema.path("username").validate(async function (value) {
  if (!value || value.length === 0) return false;
  const Account = mongoose.model("Account");
  const exists = await Account.exists({
    _id: { $ne: this._id },
    username: value.toLowerCase(),
    disabled: false,
  });
  return !exists;
});

AccountSchema.path("password").validate(function (value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.length < 8) return false;
  return true;
});

AccountSchema.path("email").validate(async function (value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  const Account = mongoose.model("Account");
  const exists = await Account.exists({
    _id: { $ne: this._id },
    email: value.toLowerCase(),
    disabled: false,
  });
  return !exists;
});

AccountSchema.pre("validate", async function (next) {
  // At least one admin must stay active
  if (
    (
      (this.isModified("permissions") && !(this.permissions & PERMISSIONS.ADMIN)) ||
      (this.isModified("disabled") && this.disabled === true && (this.permissions & PERMISSIONS.ADMIN))
    ) &&
    !(await mongoose.model("Account").exists({
      _id: { $ne: this._id },
      permissions: { $bitsAllSet: PERMISSIONS.ADMIN },
      disabled: false,
    })) &&
    (await mongoose.model("Account").exists({
      _id: this._id,
      permissions: { $bitsAllSet: PERMISSIONS.ADMIN },
    }))
  ) {
    return next(new Error("At least one admin must be defined"));
  }
  next();
});

AccountSchema.pre("save", async function (next) {
  if (this.username) this.username = this.username.toLowerCase();
  if (this.email) this.email = this.email.toLowerCase();

  if (this.isModified("password") && this.password) {
    try {
      this.password = await bcryptjs.hash(this.password, 10);
    }
    catch (err) {
      return next(err);
    }
  }

  if (this.isModified("disabled") && this.disabled) {
    this.password = null;
  }
  next();
});

// Never return the hashed password
AccountSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default model("Account", AccountSchema);
