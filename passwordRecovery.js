// Represent a PasswordRecovery entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class PasswordRecovery extends Entity {


    //password recovery schema
    static passwordRecoverySchema = new mongoose.Schema({
        email: {type: "String", required: true},
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true},
        changed: {type: "Boolean", default: false, required:true},
        uuid: {type: "String", required: true}
    });

    //create provider model
    static model = mongoose.model("PasswordRecovery", PasswordRecovery.passwordRecoverySchema, "PasswordRecovery");
}
