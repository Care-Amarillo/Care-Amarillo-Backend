// Represent a ManagingUser entity.
import mongoose from "mongoose";
import Entity from "./entity.js";

export default class ManagingUser extends Entity {


    //managing user schema
    static managingUserSchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        provider: {type: mongoose.Schema.Types.ObjectId, ref:'Provider', required: true},
        //active status is set to false when user no longer works for provider or user type gets to set a regular user
        active: {type: "Boolean", default: true, required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true}

    });


    static async checkIfActiveManagingUser(requestedUser, providerId ){

        //todo: rewrite to make canMakeRequest default to false
        let canMakeRequest = true;
        let propertiesToPopulate = ['provider', 'user'];


        if(!requestedUser.superAdmin){ //if user is not a super admin check provider and active status
            //check if requested user has permissions
            let requestedUserDocs = await ManagingUser.read({ user: requestedUser._id}, propertiesToPopulate);
            if(requestedUserDocs.length > 0){
                let requestedManager = requestedUserDocs[0];
                let requestedManagerProvider = requestedManager.provider;
                let requestedManagerUser = requestedManager.user;
                if(requestedManagerProvider._id.toString() !== providerId){//check if provider is not valid
                    canMakeRequest = false;
                }
                else if(!requestedManagerUser.active){ //check if user status is not active
                    canMakeRequest = false;
                }
            }
            else{
                canMakeRequest = false;
            }
        }
        else if( !requestedUser.active ){
            canMakeRequest = false;
        }

        return canMakeRequest;

    }

    //create managing user model
    static model = mongoose.model("ManagingUser", ManagingUser.managingUserSchema, "ManagingUsers");
}