// Represent a ThirdPartyApp entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class ThirdPartyApp extends Entity {


    //third party app schema
    static thirdPartyAppSchema = new mongoose.Schema({
        name: {type: "String", required: true},
        updatedAt: {type: "Date", default: Date.now, required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        active: {type: "Boolean", default: false, required:true}

    });

    //create third party app model
    static model = mongoose.model("ThirdPartyApp", ThirdPartyApp.thirdPartyAppSchema, "ThirdPartyApps");
}
