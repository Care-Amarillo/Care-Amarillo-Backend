// Using ES6 imports
import mongoose from 'mongoose';
import './dbconnection.js'; 
//configure passport
import './passport.js';

import passport from 'passport';
import JWT from 'jsonwebtoken';

//import model classes
import Provider from './provider.js';
import User from './user.js';
import ProviderEntry from './providerEntry.js';
import ManagingUser from './managingUser.js';
import AuditEntry from './auditEntry.js';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import url from 'url';

mongoose.Promise = global.Promise;



const app = express();

const port = 3000;

app.use( bodyParser.json() );
app.use( cors() );
app.use(bodyParser.urlencoded({ extended: true }));

//listen on specified port
app.listen(port, () => {

});


/*************USER ENDPOINTS*****************/

//get all users
app.get("/users", passport.authenticate("jwt", {session:false}),  async(req, res) => {

    try{

        let requestedUser = req.user;
        //only allow super admins to access all users
        if(!requestedUser.superAdmin){
            return res.send({"Message": "Unauthorized"});
        }

        let allUsers = await User.read();
       
        res.send(allUsers);
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get user by id
app.get("/users/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{
        //get user id
        let userId = req.params.userId;
        let allUsers = await User.read({_id: userId});
        //check if user exists
        if(allUsers.length > 0){
            let userDoc = allUsers[0];

            let newModel = {}
            //remove password and salt
            for(let [key, value] of Object.entries(userDoc.toJSON())) {
                if(key == "password" || key == "salt") continue;
                newModel[key] = value;
            }

            res.send(newModel);

        }
        else{
            res.send({"message": "User doesn't exist"});

        }

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//authenticate user
app.post("/users/authenticate", async(req, res) => {


    try{
       
        passport.authenticate("local", {session:false}, (err, user, info) => {

            //check if error or no user object exists
            if(err || !user){
                return res.status(400).json({
                    message: "Something happened and authentication was unsuccessful",
                    user: user
                });
            }

           
            //login user via passport
            req.login(user, {session: false}, (error) => {
                if(error){
                    res.send(error);
                }
                //generate JWT token
                const token = JWT.sign(user, "7dV4J9Y85u35P!mb4hT2brQ2ikXMYp^%f1h");
                return res.json({ user, token});

            });

        })(req, res); //passing req and res to next middleware
    }
    catch(error){
        console.log("error: " + error);
        res.send(error);
    }

});


//update user password
app.put("/users/updatePassword/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        
        let requestedUser = req.user;
        let userId = req.params.userId;
        
        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if(!validUser){
            return res.send({"Message": "Unauthorized"});
        }
        
       
        //get body from the request
        let body = req.body;

        let allUsers = await User.read({_id: userId});

        if(allUsers.length > 0){
            let userDoc = allUsers[0];
            //generate salt and encrypted password for the user
            let encryptedPasswordAndSalt = await User.generateHash(body.password);
            let encryptedPassword = encryptedPasswordAndSalt.encryptedString;
            let salt = encryptedPasswordAndSalt.salt;

             //set data for new password
            let updateFields = {
                password: encryptedPassword,
                salt: salt,
                updatedAt: Date.now()
            };

            

             //add audit entry before saving 
             AuditEntry.addAuditEntry(req.user, updateFields, "Update", "PUT", "/users/password/:userId", userDoc, "User");

             //update user
             let updatedUser = await User.update(userDoc, updateFields); 
 
 
             let cleanUpdatedUser = {}
             for(let [key, value] of Object.entries(updatedUser.toJSON())) {
                 if(key == "password" || key == "salt") continue;
                 cleanUpdatedUser[key] = value;
             }
 
             //send update user response
             res.send({"Message":"Updated User successfully", user: cleanUpdatedUser});
        }
        else{
            res.send({"Message":"User doesn't exist"});
        }

    }
    catch(error){
        console.log(error);
        res.send(error);
    }
});


//create user
app.post("/users", async(req, res) => {


    try{

        //get body from the request
        let body = req.body;
        
        if(!body.fName || 
            !body.lName ||
            !body.email ||
            !body.phone ||
            !body.title ||
            !body.userType ||
            !body.password 
           ){
                return res.send({"Message": "Missing information"});
           } 


           //validate phone
        let validPhone = await User.validPhone(body.phone);
        if(!validPhone){
            return res.send({"Message": "Invalid Phone Number"});
        }

           //validate email
        let validEmail = await User.validEmail(body.email);
        if(!validEmail){
            return res.send({"Message": "Invalid Email"});
        }

        //check if the user email exists
        let allUsers = await User.read({email: body.email});

        //dont allow user to be created more than once
        if(allUsers.length > 0){
            return res.send({"Message": "User exists"});
        }

        //generate salt and encrypted password for the user
        let encryptedPasswordAndSalt = await User.generateHash(body.password);
        let encryptedPassword = encryptedPasswordAndSalt.encryptedString;
        let salt = encryptedPasswordAndSalt.salt;


      

        //set data for new user
        let newUserInfo = {
            fName: body.fName,
            lName: body.lName,
            email: body.email,
            phone: body.phone,
            title: body.title,
            admin: body.admin,
            superAdmin: body.superAdmin,
            userType: body.userType,
            active: body.active,
            password: encryptedPassword,
            salt: salt
        };

        //create user
        let user = await User.create(newUserInfo);


        let cleanUser = {}
        for(let [key, value] of Object.entries(user.toJSON())) {
            if(key == "password" || key == "salt") continue;
            cleanUser[key] = value;
        }

        res.send({"Message": "Person created successfully", user: cleanUser});
    }
    catch(error){
        console.log(error);
        res.send(error);
    }
});



//update user
app.put("/users/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get user id
        let userId = req.params.userId;
        let allUsers = await User.read({_id: userId});

        let requestedUser = req.user; 

        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if(!validUser){
            return res.send({"Message": "Unauthorized"});
        }

        
        //check if user exists
        if(allUsers.length > 0){
            let userDoc = allUsers[0];
            let updateFields = req.body;
            updateFields.updatedAt = Date.now();

            //add audit entry before saving 
            AuditEntry.addAuditEntry(req.user, req.body, "Update", "PUT", "/users/:userId", userDoc, "User");

            //update user
            let updatedUser = await User.update(userDoc, updateFields); 


            let cleanUpdatedUser = {}
            for(let [key, value] of Object.entries(updatedUser.toJSON())) {
                if(key == "password" || key == "salt") continue;
                cleanUpdatedUser[key] = value;
            }

            //send update user response
            res.send({"Message":"Updated User successfully", user: cleanUpdatedUser});


        }
        else{
            res.send({"Message":"User doesn't exist"});
        }
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});

/*************END USER ENDPOINTS*****************/




/*************PROVIDER ENDPOINTS*****************/

//get all providers
//everyone can read all providers
//anonymous user will need to look up providers
app.get("/providers" , async(req, res) => {

    const queryObject = url.parse(req.url,true).query;
    const searchQuery = queryObject.searchQuery;

    try{
        //let allProviders = await Provider.read();
        let allProviders = await Provider.read({name:{$regex:searchQuery,$options:'i'}});
        res.send(allProviders);
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});

app.get("/providersActive" , async(req, res) => {

    const queryObject = url.parse(req.url,true).query;
    const searchQuery = queryObject.searchQuery;

    try{
        //let allProviders = await Provider.read();
        let allProviders = await Provider.read({active:true, name:{$regex:searchQuery,$options:'i'}});
        res.send(allProviders);
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get provider by id
app.get("/providers/:providerId", async(req, res) => {

    try{
        //get provider id
        let providerId = req.params.providerId;


        let allProviders = await Provider.read({_id: providerId});
        if(allProviders.length > 0){
            let providerDoc = allProviders[0];
            res.send(providerDoc);
        }
        else{
            res.send({"Message":"No providers found with given id"});
        }

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});




//create provider using super admin
app.post("/providers", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{
        
        //get body from the request
        let body = req.body;
	    console.log("req.body " + JSON.stringify(req.body));

        if(
            !body.name ||
            !body.phone ||
            !body.email ||
            !body.title ||
            !body.zip ||
            !body.address 
        )
        {
            return res.send({"Message": "Missing Data"});
        }

        if(!Number.isInteger(body.totalBeds)){
            return res.send({"Message": "Invalid Total Beds"});
        }

        if(!Number.isInteger(body.bedsUsed)){
            return res.send({"Message": "Invalid Beds Used"});
        }

        let validPhone = await User.validPhone(body.phone);
        if(!validPhone){
            return res.send({"Message": "Invalid Phone Number"});
        }

        let validEmail = await User.validEmail(body.email);
        if(!validEmail){
            return res.send({"Message": "Invalid Email"});
        }



        let requestedUser = req.user;

        //if(!requestedUser.superAdmin && !requestedUser.active){
         //   return res.send({"Message": "Unauthorized"});
       // }

        //check if the provider name exists
        let allProviders = await Provider.read({name: body.name});
        //if provider name exists, send message to client
        if(allProviders.length > 0){
            return res.send({"Message": "Provider name exists"});
        }

        //check if the provider name exists
        allProviders = await Provider.read({email: body.email});
        //if provider name exists, send message to client
        if(allProviders.length > 0){
            return res.send({"Message": "Provider email exists"});
        }

        //todo: maybe check address and phone?
        

        //set data for new provider
        let newProviderInfo = {
            name: body.name,
            phone: body.phone,
            email: body.email,
            title: body.title,
            type: body.type,
            zip: body.zip,
            place_id: body.place_id,
            address: body.address,
            totalBeds: body.totalBeds,
            bedsUsed: body.bedsUsed,
            active: body.active
        };

        if(body.lat){
            newProviderInfo.lat = body.lat;
        }
        if(body.long){
            newProviderInfo.long = body.long;
        }


        //create provider
        let provider = await Provider.create(newProviderInfo);

        AuditEntry.addAuditEntry(req.user, req.body, "Create", "POST", "/providers", provider, "Provider");


        //if(!user || !provider){
       //     return res.send({"Message": "Missing Information"});
      //  }


     //   let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, provider);
     //   if(!canMakeRequest){
      //      return res.send({"Message": "Unauthorized"});
      //  }


    //    let allManagingUsers = await ManagingUser.read({provider: provider, user: user});
    //    if(allManagingUsers.length > 0){
    //        return res.send({"Message": "Managing User Exists"});
    //    }


        console.log("requested user: " + JSON.stringify(requestedUser));

        //set data for new managing user
        let newManagingUserInfo = {
            user: requestedUser._id,
            active: true,
            provider: provider._id
        };

        //create managing user
        let managingUser = await ManagingUser.create(newManagingUserInfo);

        let allUsers = await User.read({_id: requestedUser._id});
	let userDocToUpdate = allUsers[0]; 
	let updateFields = {};
	for(let [key, value] of Object.entries(requestedUser)) {
            if(key == "salt" || key == "password") continue;
	    updateFields[key] = value;
	}
	updateFields.updatedAt = Date.now();
	updateFields.admin = true;

	console.log("user to update: " + JSON.stringify(userDocToUpdate));
	console.log("user update fields: " + JSON.stringify(updateFields));


	//update user
	let updatedUser = await User.update(userDocToUpdate, updateFields);


	let cleanUpdatedUser = {}
	for(let [key, value] of Object.entries(updatedUser.toJSON())) {
	    if(key == "password" || key == "salt") continue;
	    cleanUpdatedUser[key] = value;
	}


     //   await AuditEntry.addAuditEntry(user, body, "Create", "POST", "/managingUsers", managingUser, "ManagingUser");

        res.send({"Message": "Provider created successfully", provider:provider, updatedUser: cleanUpdatedUser});
    }
    catch(error){
        console.log(error);
        res.send(error);
    }
});



//update provider
app.put("/providers/:providerId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get provider id
        let providerId = req.params.providerId;


        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }


        let allProviders = await Provider.read({_id: providerId});
        //check if provider exists
        if(allProviders.length > 0){
            let providerDoc = allProviders[0];

            let body = req.body;
            let currentBedsUsed = body.bedsUsed;
            let previousBedsUsed = providerDoc.bedsUsed;


            if(currentBedsUsed && currentBedsUsed != previousBedsUsed ){

                let changeCount = currentBedsUsed - previousBedsUsed;

                //add bed change to provider entries
                const providerEntry = new ProviderEntry();
                //get objectId to add to provider
                const idToSearch = new mongoose.Types.ObjectId(providerDoc._id);
                providerEntry.amountChanged = changeCount;
                providerEntry.provider = idToSearch;
                //add provider entry
                await ProviderEntry.create(providerEntry);

                await AuditEntry.addAuditEntry(req.user, req.body, "Create", "PUT", "/providers/:providerId", providerDoc, "ProviderEntry");

            }

            await AuditEntry.addAuditEntry(req.user, req.body, "Update", "PUT", "/providers/:providerId", providerDoc, "Provider");

            let updateFields = body;
            updateFields.updatedAt = Date.now();
            let updatedProvider = await Provider.update(providerDoc, updateFields); 
            res.send({"Message":"Updated Provider successfully", provider: updatedProvider});
        }
        else{
            res.send({"Message":"Provider doesn't exist"});
        }
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});




/*************END PROVIDER ENDPOINTS*****************/




/*************PROVIDER ENTRY ENDPOINTS*****************/

//get all provider entries
app.get("/providerEntries", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{
        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
        }

        const queryObject = url.parse(req.url,true).query;
        console.log(queryObject);
	
        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;

        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({ createdAt: {"$gte":  startDate, "$lt":  endDate}}, propertiesToPopulate);
     

        res.send(allProviderEntries);
        
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get all provider entries between two dates
app.get("/providerEntriesByDate/:providerId", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{
        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
        }


        //get provider id
        let providerId = req.params.providerId;

        //let requestedUser = req.user;
       // let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
      //  if(!canMakeRequest){
       //     return res.send({"Message": "Unauthorized"});

        const queryObject = url.parse(req.url,true).query;
        console.log(queryObject);
	
        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;
	console.log("start date is :" + queryObject.startDate);
	console.log("end date is :" + queryObject.endDate);
	console.log("current date is :" + new Date().toISOString());

        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({ createdAt: {"$gte":  startDate, "$lt":  endDate}}, propertiesToPopulate);
     
        res.send(allProviderEntries);
        
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get all provider entries by providerId
app.get("/providerEntries/:providerId", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{

        //get provider id
        let providerId = req.params.providerId;

        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }


        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({provider: providerId}, propertiesToPopulate);

        res.send(allProviderEntries);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});




//create provider entry
// Updating provider inserts into provider entry,
// but maybe server is down or something and you need to update data not accounted for
app.post("/providerEntries", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        
        //get body from the request
        let body = req.body;

        //set data for new provider entry
        let newProviderInfo = {
            amountChanged: body.amountChanged,
            provider: body.provider,
            createdAt: body.createdAt
        };

        //create provider entry
        let providerEntry = await ProviderEntry.create(newProviderInfo);

        res.send({"Message": "Provider Entry created successfully", providerEntry:providerEntry});
    }
    catch(error){
        console.log(error);
        res.send(error);
    }
});




/*************END PROVIDER ENTRY ENDPOINTS*****************/





/*************MANAGING USER ENDPOINTS*****************/

//get all managing users
app.get("/managingUsers", passport.authenticate("jwt", {session:false}),  async(req, res) => {

    try{
        let propertiesToPopulate = ['provider', 'user'];

        let requestedUser = req.user;

        if(!requestedUser.superAdmin  && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
        }

        let allManagingUsers = await ManagingUser.read(null, propertiesToPopulate);
        res.send(allManagingUsers);

        
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get all managing users by provider id
app.get("/managingUsers/provider/:providerId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get provider id
        let providerId = req.params.providerId;

        //get user that made the request
        let propertiesToPopulate = ['provider', 'user'];

        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }
        
        let allManagingUsers = await ManagingUser.read({provider: providerId},propertiesToPopulate);
        res.send(allManagingUsers);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get  managing users by user id
app.get("/managingUsers/user/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get user id
        let userId = req.params.userId;

        //get user that made the request
        let requestedUser = req.user;

        //check if requested user is super admin or actual user of the managing user
        //if( !requestedUser.superAdmin || !requestedUser.active){
        if(  !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
        }

      
        let propertiesToPopulate = ['provider', 'user'];
        let allManagingUsers = await ManagingUser.read({user: userId},propertiesToPopulate);
        res.send(allManagingUsers);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});

//get managing users by provider id and userId
app.get("/managingUsers/provider/:providerId/user/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get provider id
        let providerId = req.params.providerId;
        //get user id
        let userId = req.params.userId;

        //get user that made the request
        let requestedUser = req.user;
        
        //check if requested user is super admin or actual user of the managing user
        if( !requestedUser.superAdmin && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
        }

        let propertiesToPopulate = ['provider', 'user'];
        let allManagingUsers = await ManagingUser.read({provider: providerId, user: userId},propertiesToPopulate);
        res.send(allManagingUsers);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});




//create managing user
//would be called after create user endpoint is called and user type is set to 2
//can be created by super admins or other managing user of the same provider
app.post("/managingUsers",  passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{

        //get body from the request
        let body = req.body;
        let provider = body.provider;
        let user = body.user;
        let active = body.active;
        let requestedUser = req.user;

        if(!user || !provider){
            return res.send({"Message": "Missing Information"});
        }
        

        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, provider);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }


        let allManagingUsers = await ManagingUser.read({provider: provider, user: user});
        if(allManagingUsers.length > 0){
            return res.send({"Message": "Managing User Exists"});
        }



        //set data for new managing user
        let newManagingUserInfo = {
            user: user,
            active: active,
            provider: provider
        };

        //create managing user
        let managingUser = await ManagingUser.create(newManagingUserInfo);

        await AuditEntry.addAuditEntry(req.user, body, "Create", "POST", "/managingUsers", managingUser, "ManagingUser");

        res.send({"Message": "Managing User created successfully", managingUser:managingUser});
    }
    catch(error){
        console.log(error);
        res.send(error);
    }
});



//update managing user
//used to update managing users active status
//active status is set to false when user no longer works for provider or user type gets to set a regular user
//only let super admins and actual user of the managing user to make the request
app.put("/managingUsers/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {

    try{
        //get user id
        let userId = req.params.userId;
        //get user that made the request
        let requestedUser = req.user;

       
        
        //check if managing user exists
        let allManagingUsers = await ManagingUser.read({user: userId});
        if(allManagingUsers.length > 0){
            let managingUserDoc = allManagingUsers[0];


            if(requestedUser.superAdmin){
                if(!requestedUser.active){
                    return res.send({"Message": "Unauthorized"});
                }
            }
          
            let updateFields = req.body;
            updateFields.updatedAt = Date.now();
            let updatedManagingUser = await ManagingUser.update(managingUserDoc, updateFields); 
            res.send({"Message":"Updated Managing User successfully", provider: updatedManagingUser});
        }
        else{
            res.send({"Message":"Managing User doesn't exist"});
        }

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});

/*************END MANAGING USER ENDPOINTS*****************/




/*************AUDIT ENTRY ENDPOINTS*****************/

//get all audit entries
app.get("/auditEntries", passport.authenticate("jwt", {session:false}), async(req, res) => {
    

    try{

        let requestedUser = req.user;
        if(!requestedUser.superAdmin){
            return res.send({"Message": "Unauthorized"});

        }

	const queryObject = url.parse(req.url,true).query;
        console.log(queryObject);
	
        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;
	console.log("start date is :" + queryObject.startDate);
	console.log("end date is :" + queryObject.endDate);
	console.log("current date is :" + new Date().toISOString());


        let propertiesToPopulate = [ 'user', 'provider', 'providerEntry', 'managingUser', 'createdBy' ];
        let allAuditEntries = await AuditEntry.read({ createdAt: {"$gte":  startDate, "$lt":  endDate}}, propertiesToPopulate);
        res.send(allAuditEntries);
    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get all audit entries by providerId
app.get("/auditEntries/providers/:providerId", passport.authenticate("jwt", {session:false}), async(req, res) => {


    try{
        //get provider id
        let providerId = req.params.providerId;


        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }

        let propertiesToPopulate = ['provider', 'createdBy'];
        let allProviderEntries = await AuditEntry.read({provider: providerId}, propertiesToPopulate);

        res.send(allProviderEntries);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//get all audit entries by userId
app.get("/auditEntries/user/:userId", passport.authenticate("jwt", {session:false}), async(req, res) => {


    //todo: maybe let managing users access as well

    try{

        let requestedUser = req.user;
        if(!requestedUser.superAdmin){
            return res.send({"Message": "Unauthorized"});

        }

        //get user id
        let userId = req.params.userId;
        let propertiesToPopulate = [ 'user', 'provider', 'providerEntry', 'managingUser', 'createdBy' ];
        let allProviderEntries = await AuditEntry.read({createdBy: userId}, propertiesToPopulate);

        res.send(allProviderEntries);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});






/*************END AUDIT ENTRY ENDPOINTS*****************/
