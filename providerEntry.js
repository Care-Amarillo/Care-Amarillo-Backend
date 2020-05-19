// Represent a Provider entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class ProviderEntry extends Entity {


    //provider entry schema
    //every time a provider adds or removes a bed, this will get updated
    static providerEntrySchema = new mongoose.Schema({
        amountChanged: {type: "Number", default: 0, required: true},
        provider: {type: mongoose.Schema.Types.ObjectId, ref:'Provider', required: true},
        createdAt: {type: "Date", default: Date.now, required: true}
       

    });

    //create provider entry model
    static model = mongoose.model("ProviderEntry", ProviderEntry.providerEntrySchema, "ProviderEntries");
}