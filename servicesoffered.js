import mongoose from "mongoose";
import Entity from "./entity.js";

export default class ServicesOffered extends Entity {

    static schema = new mongoose.Schema({

        AvailableBeds: { type: "Number", required: true},
        TotalBeds: { type: "Number", required: true},
        VolunteerOpportunities: { type: "Number", required: true},
        VolunteersNeeded: { type: "Number", required: true},
        ServiceType: { type: "String", required: true},
        ServicesDescription: { type: "String", required: true},
        CriteriaForService: { type: "String", required: true},
        WarmingStation: { type: "String", required: true},
        CoolingStation: { type: "String", required: true},
        createdAt: { type: "Date", default: new Date() },
        updatedAt: { type: "Date", default: new Date() },
        Provider: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider"}]
    
    });

 
    static model = mongoose.model("ServicesOffered", ServicesOffered.schema, "ServicesOffered");
}

