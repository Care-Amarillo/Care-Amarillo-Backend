// Represent a User entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class User extends Entity {

    //user schema
    static userSchema = new mongoose.Schema({
        fName: {type: "String", required: true},
        lName: {type: "String", required: true},
        email: {type: "String", required:true}, 
        phone: {type: "String", required: true},
        title: {type: "String", required: true},
        admin: {type: "Boolean", default: false, required: true},
        userType: {type: "Number", default:1, required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true},
        active: {type: "Boolean", default: false, required:true}

    });

    //create user model
    static model = mongoose.model("User", User.userSchema, "Users");
}