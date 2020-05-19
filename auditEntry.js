// Represent a AuditEntry entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class AuditEntry extends Entity {


    //audit entry schema
    //give all schemas to reference and dont require them
    static schema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false},
        provider: {type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: false},
        providerEntry: {type: mongoose.Schema.Types.ObjectId, ref: 'ProviderEntry', required: false},
        managingUser: {type: mongoose.Schema.Types.ObjectId, ref: 'ManagingUser', required: false},
        createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false}, //user that requested the change
        ref:  {type: "String", required: true}, //name of Class
        propertiesChanged:  {type: "String", required: false}, //properties changed, comma-delimited
        propertyValuesBefore:  {type: "Object", required: false}, //value of properties before change
        propertyValuesAfter:  {type: "Object", required: false}, //value of properties after change
        action:  {type: "String", required: true}, //what crud operation happened
        requestMethod:  {type: "String", required: true}, //which HTTP request method was called
        endpoint:  {type: "String", required: true}, //what endpoint was called 
        createdAt: {type: "Date", default: Date.now, required: true},
    });


    static async addAuditEntry(userCreatedBy, body, action, requestedMethod, endpoint, doc, ref ){

        const auditEntry = new AuditEntry();

        if(action === "Update"){

            let keysUpdated = "";
            for(let [key, value] of Object.entries(body)) {
                if(keysUpdated === ""){
                    keysUpdated += key;
                }
                else{
                    keysUpdated += `,${key}`;
                }
            }

            let docProperties = {};
            for(let [key, value] of Object.entries(doc.toJSON())) {
                if(keysUpdated.includes(key)){
                    docProperties[key] = value;
                }
            }

            auditEntry.propertiesChanged = keysUpdated;
            auditEntry.propertyValuesBefore = docProperties;
            auditEntry.propertyValuesAfter = body;

        }

        //add changes to audit entry
        //get objectId to add to audit entry
        const idToSearch = new mongoose.Types.ObjectId(doc._id);
        const idCreatedBy = new mongoose.Types.ObjectId(userCreatedBy._id);

        //figure out which entity to set the ObjectID for
        switch(ref) {
            case "User":
                auditEntry.user = idToSearch;
              break;
            case "Provider":
                auditEntry.provider = idToSearch;
              break;
            case "ProviderEntry":
                auditEntry.providerEntry = idToSearch;
              break;
            case "ManagingUser":
                auditEntry.managingUser = idToSearch;
              break;
        }

        //set the requested user
        auditEntry.createdBy = idCreatedBy;
        auditEntry.ref = ref;
        auditEntry.action = action;
        auditEntry.requestMethod = requestedMethod;
        auditEntry.endpoint = endpoint;

        //create audit entry
        await AuditEntry.create(auditEntry);
    }

    //create audit entry model
    static model = mongoose.model("AuditEntry", AuditEntry.schema, "AuditEntries");
}