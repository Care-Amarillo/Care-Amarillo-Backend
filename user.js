// Represent a User entity.
import mongoose from "mongoose";
import Entity from "./entity.js";
//import bcrypt for encryption
import bcrypt from 'bcrypt';

export default class User extends Entity {

    //user schema
    //user type 1 is a 'regular' user
    //user type 2 is an admin (managing user)
    //user type 3 is a super admin. A super admin is the system admin
    //todo: maybe have another admin that can alter managing user data
    static userSchema = new mongoose.Schema({
        fName: {type: "String", required: true},
        lName: {type: "String", required: true},
        email: {type: "String", required:true}, 
        phone: {type: "String", required: false},
        title: {type: "String", required: true},
        pushId: {type: "String", default:"", required: false}, //for targeted push notifications
        password: {type: "String", required: true},
        salt: {type: "String", required: false},
        admin: {type: "Boolean", default: false, required: true},
        superAdmin: {type: "Boolean", default: false, required: true},
        userType: {type: "Number", default:1, required: true},
        createdAt: {type: "Date", default: Date.now, required: true},
        updatedAt: {type: "Date", default: Date.now, required: true},
        active: {type: "Boolean", default: false, required:true},
        passwordLastUpdated: {type: "Date", default: Date.now, required: true}

    });


    //chekc if its the actual user making the request or a super admin
    static async checkIfValidUserForRequest(requestedUser, userId){
        let isValid = true; 
        console.log("requested user is " + JSON.stringify(requestedUser));
        console.log("userId sent is " + JSON.stringify(userId));
        if(!requestedUser.superAdmin){
            console.log("is not super admin")
            if(requestedUser._id.toString() !== userId  ){
                console.log("user id dont match");
                isValid = false;
            }
            else{
                console.log("user ids match");
            }
        }
        else if(!requestedUser.active){
            console.log("super admin but not active")
            isValid = false;
        }

        return isValid;
    }

    //check if this is a valid email
    static async validEmail(email){
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    //check if this is a valid phone number
    static async validPhone(phoneNumber){
        let validPhone = false; 
        let re = /\D+/g;
        let cleanphone = phoneNumber.replace(re,"");
        if(cleanphone.length !== 10){
            validPhone = false;
        }
        else{
            validPhone = true;
        }
        return validPhone;
    }


    static async generateHash(theString){
        //generate salt
        //ten rounds for bcrypt to generate salt value
        const saltRounds = 10;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(theString, salt);
        
        return { salt:salt, encryptedString:hash};
    }


    static async authenticate(givenPassword, theUserDoc){
        let salt = theUserDoc.salt;
        let encryptedPassword = theUserDoc.password;
        const match = await bcrypt.compare(givenPassword, encryptedPassword);
        return match;
    }

    //create user model
    static model = mongoose.model("User", User.userSchema, "Users");
}