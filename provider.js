// Represent a Provider entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class Provider extends Entity {


    //provider schema
    static providerSchema = new mongoose.Schema({
        name: {type: "String", required: true},
        lat: {type: "String", default:"", required: false},
        long: {type: "String",default:"", required: false},
        address: {type: "String", required: true},
        email: {type: "String", required:true}, 
        phone: {type: "String", required: true},
        title: {type: "String", required: true},
        zip: {type: "String",  required: true},
        type: {type: "Number", default:1, required: true},
        bedsUsed: {type: "Number", default: 0, required: true},
        totalBeds: {type: "Number", default: 0, required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true},
        active: {type: "Boolean", default: false, required:true}

    });

    //create provider model
    static model = mongoose.model("Provider", Provider.providerSchema, "Providers");
}