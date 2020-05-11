// Represent a ManagingUser entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class ManagingUser extends Entity {


    //managing user schema
    static managingUserSchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        provider: {type: mongoose.Schema.Types.ObjectId, ref:'Provider', required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true}

    });

    //create managing user model
    static model = mongoose.model("ManagingUser", ManagingUser.managingUserSchema, "ManagingUser");
}