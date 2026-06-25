import mongoose from "mongoose";

const { Schema, model } = mongoose;

const RoomSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  uuid: { type: String, required: true, unique: true },
  building: { type: String, required: true, trim: true },
}, { versionKey: false });

export default model("Room", RoomSchema);
