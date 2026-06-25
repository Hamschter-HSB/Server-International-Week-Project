import { v4 as uuidv4 } from "uuid";
import Errors from "../commons/errors.js";
import Room from "../models/room.model.js";
import { answer } from "./ControllerAnswer.js";

export const getRooms = async (req, res, next) => {
  answer.reset();
  try {
    const rooms = await Room.find().sort({ name: 1 }).exec();
    answer.setPayload(rooms);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};

export const getRoomById = async (req, res, next) => {
  answer.reset();
  try {
    const room = await Room.findById(req.params.id).exec();
    if (!room) {
      answer.set(Errors.getError(Errors.DATABASE.INVALID_TARGET));
      return next(answer);
    }
    answer.setPayload(room);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};

export const createRoom = async (req, res, next) => {
  answer.reset();
  const { name, building } = req.body ?? {};
  if (!name || !building) {
    answer.set(Errors.getError(Errors.REQUEST.MISSING_PARAMETER));
    return next(answer);
  }
  try {
    if (await Room.exists({ name }).exec()) {
      answer.set(Errors.getError(Errors.DATABASE.ALREADY_EXISTS));
      return next(answer);
    }
    // The uuid is drawn at random unless the client provides one
    const room = await new Room({ name, building, uuid: req.body.uuid || uuidv4() }).save();
    answer.setPayload(room);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};

export const updateRoom = async (req, res, next) => {
  answer.reset();
  try {
    const update = {};
    ["name", "uuid", "building"].forEach((k) => {
      if (req.body?.[k] !== undefined) update[k] = req.body[k];
    });

    // a room name must stay unique across the other rooms
    if (update.name && await Room.exists({ name: update.name, _id: { $ne: req.params.id } }).exec()) {
      answer.set(Errors.getError(Errors.DATABASE.ALREADY_EXISTS));
      return next(answer);
    }

    const room = await Room.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).exec();
    if (!room) {
      answer.set(Errors.getError(Errors.DATABASE.INVALID_TARGET));
      return next(answer);
    }
    answer.setPayload(room);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};

export const deleteRoom = async (req, res, next) => {
  answer.reset();
  try {
    const room = await Room.findByIdAndDelete(req.params.id).exec();
    if (!room) {
      answer.set(Errors.getError(Errors.DATABASE.INVALID_TARGET));
      return next(answer);
    }
    answer.setPayload(true);
    res.status(200).send(answer);
  }
  catch (err) {
    console.error(err);
    answer.set(Errors.getError(Errors.DATABASE.ERROR_WITH_THE_REQUEST));
    return next(answer);
  }
};
