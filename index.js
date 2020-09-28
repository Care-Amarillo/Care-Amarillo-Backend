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
import ServicesOffered from './servicesoffered.js';
import ManagingUser from './managingUser.js';
import AuditEntry from './auditEntry.js';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import url from 'url';

import axios from "axios";

//import env variables
import './config.js';
import ThirdPartyApp from './thirdPartyApps.js';

mongoose.Promise = global.Promise;



const app = express();

const port = process.env.EXPRESS_PORT;

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

//listen on specified port
app.listen(port, () => {

});


/*************USER ENDPOINTS*****************/

//get all users
app.get("/users", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //set variable to show if user has superAdmin rights
        let requestedUser = req.user;
        //only allow super admins to access all users
        if (!requestedUser.superAdmin) {
            return res.send({ "Message": "Unauthorized" });
        }

        //per request pull all user info from database
        let allUsers = await User.read();

        //create new array to store filtered user information objects from request
        let filteredAllUsers = [];

        //loop through allUsers array and build filteredAllUsers array after removing sensative information.
        for (let i = 0; i < allUsers.length; i++) {
            //create new objects for user removing sensative information
            //this info will be sent to endpoint request so can be filtered down more if needed
            let tempFilteredUser = {
                pushId: allUsers[i].pushId,
                admin: allUsers[i].admin,
                superAdmin: allUsers[i].superAdmin,
                userType: allUsers[i].userType,
                active: allUsers[i].active,
                _id: allUsers[i]._id,
                createdAt: allUsers[i].createdAt,
                updatedAt: allUsers[i].updatedAt,
                fName: allUsers[i].fName,
                lName: allUsers[i].lName,
                email: allUsers[i].email,
                phone: allUsers[i].phone,
                title: allUsers[i].title,
                passwordLastUpdated: allUsers[i].passwordLastUpdated
            }

            //console.log(tempFilteredUser);
            //push filter user information into new array to send to frontend
            filteredAllUsers.push(tempFilteredUser);
        }

        //send request back to frontend with filtered user information
        res.send(filteredAllUsers);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});


//get user by id
app.get("/users/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {
        //get user id
        let userId = req.params.userId;


        let requestedUser = req.user;

        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if(!validUser){
            return res.send({"Message": "Unauthorized"});
        }

        let allUsers = await User.read({_id: userId});

        //check if user exists
        if (allUsers.length > 0) {
            let userDoc = allUsers[0];

            let newModel = {}
            //remove password and salt
            for (let [key, value] of Object.entries(userDoc.toJSON())) {
                if (key == "password" || key == "salt") continue;
                newModel[key] = value;
            }

            res.send(newModel);

        }
        else {
            res.send({ "message": "User doesn't exist" });

        }

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//authenticate user
app.post("/users/authenticate", async (req, res) => {


    try {

        passport.authenticate("local", { session: false }, (err, user, info) => {

            //check if error or no user object exists
            if (err || !user) {
                return res.status(400).json({
                    message: "Something happened and authentication was unsuccessful",
                    user: user
                });
            }


            //login user via passport
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                //generate JWT token               
                //added expiresIn time for token validation.  passport will look at this before any operation
                const token = JWT.sign(user, process.env.JWT_KEY_OR_SECRET, {expiresIn: '30m'});
                return res.json({ user, token});

            });

        })(req, res); //passing req and res to next middleware
    }
    catch (error) {
        console.log("error: " + error);
        res.send(error);
    }

});



//update user pushId
app.put("/users/updatePushId/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {

        let requestedUser = req.user;
        let userId = req.params.userId;

        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if (!validUser) {
            return res.send({ "Message": "Unauthorized" });
        }


        //get body from the request
        let body = req.body;

        let allUsers = await User.read({ _id: userId });

        if (allUsers.length > 0) {
            let userDoc = allUsers[0];
            //generate salt and encrypted password for the user
            let encryptedPasswordAndSalt = await User.generateHash(body.password);
            let encryptedPassword = encryptedPasswordAndSalt.encryptedString;
            let salt = encryptedPasswordAndSalt.salt;

            let pushId = body.pushId;

            //set data for new password
            let updateFields = {
                pushId: pushId,
                updatedAt: Date.now()
            };



            //add audit entry before saving 
            //AuditEntry.addAuditEntry(req.user, updateFields, "Update", "PUT", "/users/password/:userId", userDoc, "User");

            //update user
            let updatedUser = await User.update(userDoc, updateFields);


            let cleanUpdatedUser = {}
            for (let [key, value] of Object.entries(updatedUser.toJSON())) {
                if (key == "password" || key == "salt") continue;
                cleanUpdatedUser[key] = value;
            }

            //send update user response
            res.send({ "Message": "Updated User successfully", user: cleanUpdatedUser });
        }
        else {
            res.send({ "Message": "User doesn't exist" });
        }

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});




//update user password
app.put("/users/updatePassword/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {

        let requestedUser = req.user;
        let userId = req.params.userId;

        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if (!validUser) {
            return res.send({ "Message": "Unauthorized" });
        }


        //get body from the request
        let body = req.body;

        //Setting up password length check.  This is stored in envirement variable for admin to change according to
        //company polices
        if(body.password.length < process.env.PASSWORD_LENGTH){
            return res.send({ "Message": "Password does not meet length requirements" });
        }
        

        let allUsers = await User.read({ _id: userId });

        if (allUsers.length > 0) {
            let userDoc = allUsers[0];
            //generate salt and encrypted password for the user
            let encryptedPasswordAndSalt = await User.generateHash(body.password);
            let encryptedPassword = encryptedPasswordAndSalt.encryptedString;
            let salt = encryptedPasswordAndSalt.salt;

            //set data for new password
            let updateFields = {
                password: encryptedPassword,
                salt: salt,
                passwordLastUpdated: Date.now()
            };



            //add audit entry before saving 
            AuditEntry.addAuditEntry(req.user, updateFields, "Update", "PUT", "/users/password/:userId", userDoc, "User");

            //update user
            let updatedUser = await User.update(userDoc, updateFields);


            let cleanUpdatedUser = {}
            for (let [key, value] of Object.entries(updatedUser.toJSON())) {
                if (key == "password" || key == "salt") continue;
                cleanUpdatedUser[key] = value;
            }

            //send update user response
            res.send({ "Message": "Updated User successfully", user: cleanUpdatedUser });
        }
        else {
            res.send({ "Message": "User doesn't exist" });
        }

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});


//create user
app.post("/users",passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {

        //make sure requested user is an active super admin
        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
           return res.send({"Message": "Unauthorized"});
        }

        //get body from the request
        let body = req.body;

        if (!body.fName ||
            !body.lName ||
            !body.email ||
            !body.phone ||
            !body.title ||
            !body.userType ||
            !body.password
        ) {
            return res.send({ "Message": "Missing information" });
        }


        //validate phone
        let validPhone = await User.validPhone(body.phone);
        if (!validPhone) {
            return res.send({ "Message": "Invalid Phone Number" });
        }

        //validate email
        let validEmail = await User.validEmail(body.email);
        if (!validEmail) {
            return res.send({ "Message": "Invalid Email" });
        }

        //check if the user email exists
        let allUsers = await User.read({ email: body.email });

        //dont allow user to be created more than once
        if (allUsers.length > 0) {
            return res.send({ "Message": "User exists" });
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
        for (let [key, value] of Object.entries(user.toJSON())) {
            if (key == "password" || key == "salt") continue;
            cleanUser[key] = value;
        }

        res.send({ "Message": "Person created successfully", user: cleanUser });
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});



//update user
app.put("/users/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get user id
        let userId = req.params.userId;
        let allUsers = await User.read({ _id: userId });

        let requestedUser = req.user;

        let validUser = await User.checkIfValidUserForRequest(requestedUser, userId);
        if (!validUser) {
            return res.send({ "Message": "Unauthorized" });
        }


        //check if user exists
        if (allUsers.length > 0) {
            let userDoc = allUsers[0];
            let updateFields = req.body;
            updateFields.updatedAt = Date.now();

            //add audit entry before saving 
            AuditEntry.addAuditEntry(req.user, req.body, "Update", "PUT", "/users/:userId", userDoc, "User");

            //update user
            let updatedUser = await User.update(userDoc, updateFields);


            let cleanUpdatedUser = {}
            for (let [key, value] of Object.entries(updatedUser.toJSON())) {
                if (key == "password" || key == "salt") continue;
                cleanUpdatedUser[key] = value;
            }

            //send update user response
            res.send({ "Message": "Updated User successfully", user: cleanUpdatedUser });


        }
        else {
            res.send({ "Message": "User doesn't exist" });
        }
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

/*************END USER ENDPOINTS*****************/




/*************PROVIDER ENDPOINTS*****************/

//get all providers
//everyone can read all providers
//anonymous user will need to look up providers
app.get("/providers", async (req, res) => {

    const queryObject = url.parse(req.url, true).query;
    const searchQuery = queryObject.searchQuery;

    try {
        //let allProviders = await Provider.read();
        let allProviders = await Provider.read({ name: { $regex: searchQuery, $options: 'i' } });
        res.send(allProviders);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

app.get("/providersActive", async (req, res) => {

    const queryObject = url.parse(req.url, true).query;
    const searchQuery = queryObject.searchQuery;

    try {
        //let allProviders = await Provider.read();
        let allProviders = await Provider.read({ active: true, name: { $regex: searchQuery, $options: 'i' } });
        res.send(allProviders);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get provider by id
app.get("/providers/:providerId", async (req, res) => {

    try {
        //get provider id
        let providerId = req.params.providerId;


        let allProviders = await Provider.read({ _id: providerId });
        if (allProviders.length > 0) {
            let providerDoc = allProviders[0];
            res.send(providerDoc);
        }
        else {
            res.send({ "Message": "No providers found with given id" });
        }

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});




//create provider using super admin
app.post("/providers", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {

        //make sure requested user is an active super admin
        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
           return res.send({"Message": "Unauthorized"});
        }

        //get body from the request
        let body = req.body;
        console.log("req.body " + JSON.stringify(req.body));

        if (
            !body.name ||
            !body.phone ||
            !body.email ||
            !body.title ||
            !body.zip ||
            !body.address
        ) {
            return res.send({ "Message": "Missing Data" });
        }

        if (!Number.isInteger(body.totalBeds)) {
            return res.send({ "Message": "Invalid Total Beds" });
        }

        if (!Number.isInteger(body.bedsUsed)) {
            return res.send({ "Message": "Invalid Beds Used" });
        }

        let validPhone = await User.validPhone(body.phone);
        if (!validPhone) {
            return res.send({ "Message": "Invalid Phone Number" });
        }

        let validEmail = await User.validEmail(body.email);
        if (!validEmail) {
            return res.send({ "Message": "Invalid Email" });
        }
 

        //check if the provider name exists
        let allProviders = await Provider.read({ name: body.name });
        //if provider name exists, send message to client
        if (allProviders.length > 0) {
            return res.send({ "Message": "Provider name exists" });
        }

        //check if the provider name exists
        allProviders = await Provider.read({ email: body.email });
        //if provider name exists, send message to client
        if (allProviders.length > 0) {
            return res.send({ "Message": "Provider email exists" });
        }


        let userIdToAdd = body.userId;
        if(!userIdToAdd){
             return res.send({"Message": "Missing Information: User"});
        }

        let allUsers = await User.read({ _id: userIdToAdd });
        if (allUsers.length === 0) {
             return res.send({"Message": "Invalid User"});
        }

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

        if (body.lat) {
            newProviderInfo.lat = body.lat;
        }
        if (body.long) {
            newProviderInfo.long = body.long;
        }

        //create provider
        let provider = await Provider.create(newProviderInfo);

        AuditEntry.addAuditEntry(requestedUser, body, "Create", "POST", "/providers", provider, "Provider");


        //set data for new managing user
        let newManagingUserInfo = {
            user: userIdToAdd,
            active: true,
            provider: provider._id
        };

        //create managing user
        let managingUser = await ManagingUser.create(newManagingUserInfo);

        let userDocToUpdate = allUsers[0];
        let updateFields = {};
        for (let [key, value] of Object.entries(userDocToUpdate)) {
            if (key == "salt" || key == "password") continue;
            updateFields[key] = value;
        }
        updateFields.updatedAt = Date.now();
        updateFields.admin = true;

        console.log("user to update: " + JSON.stringify(userDocToUpdate));
        console.log("user update fields: " + JSON.stringify(updateFields));


        //update user
        let updatedUser = await User.update(userDocToUpdate, updateFields);


        let cleanUpdatedUser = {}
        for (let [key, value] of Object.entries(updatedUser.toJSON())) {
            if (key == "password" || key == "salt") continue;
            cleanUpdatedUser[key] = value;
        }


        await AuditEntry.addAuditEntry(requestedUser, body, "Create", "POST", "/managingUsers", managingUser, "ManagingUser");

        res.send({ "Message": "Provider created successfully", provider: provider, updatedUser: cleanUpdatedUser });
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});



//update provider
app.put("/providers/:providerId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get provider id
        let providerId = req.params.providerId;


        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if (!canMakeRequest) {
            return res.send({ "Message": "Unauthorized" });
        }


        let allProviders = await Provider.read({ _id: providerId });
        //check if provider exists
        if (allProviders.length > 0) {
            let providerDoc = allProviders[0];

            let body = req.body;
            let currentBedsUsed = body.bedsUsed;
            let previousBedsUsed = providerDoc.bedsUsed;


            if (currentBedsUsed && currentBedsUsed != previousBedsUsed) {

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
            res.send({ "Message": "Updated Provider successfully", provider: updatedProvider });
        }
        else {
            res.send({ "Message": "Provider doesn't exist" });
        }
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});




/*************END PROVIDER ENDPOINTS*****************/




/*************PROVIDER ENTRY ENDPOINTS*****************/

//get all provider entries
app.get("/providerEntries", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {
        let requestedUser = req.user;
        if (!requestedUser.superAdmin && !requestedUser.active) {
            return res.send({ "Message": "Unauthorized" });
        }

        const queryObject = url.parse(req.url, true).query;
        console.log(queryObject);

        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;

        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({ createdAt: { "$gte": startDate, "$lt": endDate } }, propertiesToPopulate);


        res.send(allProviderEntries);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all provider entries between two dates
app.get("/providerEntriesByDate/:providerId", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {
        let requestedUser = req.user;
        if (!requestedUser.superAdmin && !requestedUser.active) {
            return res.send({ "Message": "Unauthorized" });
        }


        //get provider id
        let providerId = req.params.providerId;

        //let requestedUser = req.user;
        // let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        //  if(!canMakeRequest){
        //     return res.send({"Message": "Unauthorized"});

        const queryObject = url.parse(req.url, true).query;
        console.log(queryObject);

        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;
        console.log("start date is :" + queryObject.startDate);
        console.log("end date is :" + queryObject.endDate);
        console.log("current date is :" + new Date().toISOString());

        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({ createdAt: { "$gte": startDate, "$lt": endDate }, provider: providerId }, propertiesToPopulate);

        res.send(allProviderEntries);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all provider entries by providerId
app.get("/providerEntries/:providerId", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {

        //get provider id
        let providerId = req.params.providerId;

        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if (!canMakeRequest) {
            return res.send({ "Message": "Unauthorized" });
        }


        let propertiesToPopulate = ['provider'];
        let allProviderEntries = await ProviderEntry.read({ provider: providerId }, propertiesToPopulate);

        res.send(allProviderEntries);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

/*************END PROVIDER ENTRY ENDPOINTS*****************/





/*************MANAGING USER ENDPOINTS*****************/

//get all managing users
app.get("/managingUsers", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        let propertiesToPopulate = ['provider', 'user'];

        let requestedUser = req.user;
        //console.log(req.user);

        if (!requestedUser.superAdmin && !requestedUser.active) {
            return res.send({ "Message": "Unauthorized" });
        }

        let allManagingUsers = await ManagingUser.read(null, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredManagingUsers to store this filtered info.
        let filteredManagingUsers = [];

        //loop through the allManagersUsers array to filter each element in array
        for (let i = 0; i < allManagingUsers.length; i++) {

            //create new tempFilteredUser object to add none sensative info for request.
            //add managing user, user, and provider from database tables
            let tempFilteredUser = {
                //managing user info set here
                active: allManagingUsers[i].active,
                _id: allManagingUsers[i]._id,
                createdAt: allManagingUsers[i].createdAt,
                updatedAt: allManagingUsers[i].updatedAt,
                //user info set here with sensative data filtered out
                user: {
                    pushId: allManagingUsers[i].user.pushId,
                    admin: allManagingUsers[i].user.admin,
                    superAdmin: allManagingUsers[i].user.superAdmin,
                    userType: allManagingUsers[i].user.userType,
                    active: allManagingUsers[i].user.active,
                    _id: allManagingUsers[i].user._id,
                    createdAt: allManagingUsers[i].user.createdAt,
                    updatedAt: allManagingUsers[i].user.updatedAt,
                    fName: allManagingUsers[i].user.fName,
                    lName: allManagingUsers[i].user.lName,
                    email: allManagingUsers[i].user.email,
                    phone: allManagingUsers[i].user.phone,
                    title: allManagingUsers[i].user.title
                },
                //provider info set here
                provider: allManagingUsers[i].provider
            }

            //add filtered data to filteredManagingUsers array
            filteredManagingUsers.push(tempFilteredUser);
        }

        //send new filted user/provider info back as requested.
        res.send(filteredManagingUsers);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all managing users by provider id
app.get("/managingUsers/provider/:providerId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get provider id
        let providerId = req.params.providerId;

        //get user that made the request
        let propertiesToPopulate = ['provider', 'user'];

        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if (!canMakeRequest) {
            return res.send({ "Message": "Unauthorized" });
        }

        let allManagingUsers = await ManagingUser.read({ provider: providerId }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredManagingUsers to store this filtered info.
        let filteredManagingUsers = [];

        //loop through the allManagersUsers array to filter each element in array
        for (let i = 0; i < allManagingUsers.length; i++) {

            //create new tempFilteredUser object to add none sensative info for request.
            //add managing user, user, and provider from database tables
            let tempFilteredUser = {
                //managing user info set here
                active: allManagingUsers[i].active,
                _id: allManagingUsers[i]._id,
                createdAt: allManagingUsers[i].createdAt,
                updatedAt: allManagingUsers[i].updatedAt,
                //user info set here with sensative data filtered out
                user: {
                    pushId: allManagingUsers[i].user.pushId,
                    admin: allManagingUsers[i].user.admin,
                    superAdmin: allManagingUsers[i].user.superAdmin,
                    userType: allManagingUsers[i].user.userType,
                    active: allManagingUsers[i].user.active,
                    _id: allManagingUsers[i].user._id,
                    createdAt: allManagingUsers[i].user.createdAt,
                    updatedAt: allManagingUsers[i].user.updatedAt,
                    fName: allManagingUsers[i].user.fName,
                    lName: allManagingUsers[i].user.lName,
                    email: allManagingUsers[i].user.email,
                    phone: allManagingUsers[i].user.phone,
                    title: allManagingUsers[i].user.title
                },
                //provider info set here
                provider: allManagingUsers[i].provider
            }

            //add filtered data to filteredManagingUsers array
            filteredManagingUsers.push(tempFilteredUser);
        }

        //send user request back with filteredManagingUsers info
        res.send(filteredManagingUsers);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get  managing users by user id
app.get("/managingUsers/user/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get user id
        let userId = req.params.userId;

        //get user that made the request
        let requestedUser = req.user;



        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, provider);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }

        let propertiesToPopulate = ['provider', 'user'];
        let allManagingUsers = await ManagingUser.read({ user: userId }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredManagingUsers to store this filtered info.
        let filteredManagingUsers = [];

        //loop through the allManagersUsers array to filter each element in array
        for (let i = 0; i < allManagingUsers.length; i++) {

            //create new tempFilteredUser object to add none sensative info for request.
            //add managing user, user, and provider from database tables
            let tempFilteredUser = {
                //managing user info set here
                active: allManagingUsers[i].active,
                _id: allManagingUsers[i]._id,
                createdAt: allManagingUsers[i].createdAt,
                updatedAt: allManagingUsers[i].updatedAt,
                //user info set here with sensative data filtered out
                user: {
                    pushId: allManagingUsers[i].user.pushId,
                    admin: allManagingUsers[i].user.admin,
                    superAdmin: allManagingUsers[i].user.superAdmin,
                    userType: allManagingUsers[i].user.userType,
                    active: allManagingUsers[i].user.active,
                    _id: allManagingUsers[i].user._id,
                    createdAt: allManagingUsers[i].user.createdAt,
                    updatedAt: allManagingUsers[i].user.updatedAt,
                    fName: allManagingUsers[i].user.fName,
                    lName: allManagingUsers[i].user.lName,
                    email: allManagingUsers[i].user.email,
                    phone: allManagingUsers[i].user.phone,
                    title: allManagingUsers[i].user.title
                },
                //provider info set here
                provider: allManagingUsers[i].provider
            }

            //add filtered data to filteredManagingUsers array
            filteredManagingUsers.push(tempFilteredUser);
        }

        //send user request back with filteredManagingUsers info
        res.send(filteredManagingUsers);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

//get managing users by provider id and userId
app.get("/managingUsers/provider/:providerId/user/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get provider id
        let providerId = req.params.providerId;
        //get user id
        let userId = req.params.userId;

        //get user that made the request
        let requestedUser = req.user;

        //check if requested user is super admin or actual user of the managing user
        if (!requestedUser.superAdmin && !requestedUser.active) {
            return res.send({ "Message": "Unauthorized" });
        }

        let propertiesToPopulate = ['provider', 'user'];
        let allManagingUsers = await ManagingUser.read({ provider: providerId, user: userId }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredManagingUsers to store this filtered info.
        let filteredManagingUsers = [];

        //loop through the allManagersUsers array to filter each element in array
        for (let i = 0; i < allManagingUsers.length; i++) {

            //create new tempFilteredUser object to add none sensative info for request.
            //add managing user, user, and provider from database tables
            let tempFilteredUser = {
                //managing user info set here
                active: allManagingUsers[i].active,
                _id: allManagingUsers[i]._id,
                createdAt: allManagingUsers[i].createdAt,
                updatedAt: allManagingUsers[i].updatedAt,
                //user info set here with sensative data filtered out
                user: {
                    pushId: allManagingUsers[i].user.pushId,
                    admin: allManagingUsers[i].user.admin,
                    superAdmin: allManagingUsers[i].user.superAdmin,
                    userType: allManagingUsers[i].user.userType,
                    active: allManagingUsers[i].user.active,
                    _id: allManagingUsers[i].user._id,
                    createdAt: allManagingUsers[i].user.createdAt,
                    updatedAt: allManagingUsers[i].user.updatedAt,
                    fName: allManagingUsers[i].user.fName,
                    lName: allManagingUsers[i].user.lName,
                    email: allManagingUsers[i].user.email,
                    phone: allManagingUsers[i].user.phone,
                    title: allManagingUsers[i].user.title
                },
                //provider info set here
                provider: allManagingUsers[i].provider
            }

            //add filtered data to filteredManagingUsers array
            filteredManagingUsers.push(tempFilteredUser);
        }

        //send filteredManagingUsers array back per user request 
        res.send(filteredManagingUsers);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});




//create managing user
//would be called after create user endpoint is called and user type is set to 2
//can be created by super admins or other managing user of the same provider
app.post("/managingUsers", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {

        //get body from the request
        let body = req.body;
        let provider = body.provider;
        let user = body.user;
        let active = body.active;
        let requestedUser = req.user;

        if (!user || !provider) {
            return res.send({ "Message": "Missing Information" });
        }


        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, provider);
        if (!canMakeRequest) {
            return res.send({ "Message": "Unauthorized" });
        }


        let allManagingUsers = await ManagingUser.read({ provider: provider, user: user });
        if (allManagingUsers.length > 0) {
            return res.send({ "Message": "Managing User Exists" });
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

        res.send({ "Message": "Managing User created successfully", managingUser: managingUser });
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});



//update managing user
//used to update managing users active status
//active status is set to false when user no longer works for provider or user type gets to set a regular user
//only let super admins and actual user of the managing user to make the request
app.put("/managingUsers/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get user id
        let userId = req.params.userId;
        //get user that made the request
        let requestedUser = req.user;



        //check if managing user exists
        let allManagingUsers = await ManagingUser.read({ user: userId });
        if (allManagingUsers.length > 0) {
            let managingUserDoc = allManagingUsers[0];


            if (requestedUser.superAdmin) {
                if (!requestedUser.active) {
                    return res.send({ "Message": "Unauthorized" });
                }
            }

            let updateFields = req.body;
            updateFields.updatedAt = Date.now();
            let updatedManagingUser = await ManagingUser.update(managingUserDoc, updateFields);
            res.send({ "Message": "Updated Managing User successfully", provider: updatedManagingUser });
        }
        else {
            res.send({ "Message": "Managing User doesn't exist" });
        }

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

/*************END MANAGING USER ENDPOINTS*****************/




/*************AUDIT ENTRY ENDPOINTS*****************/

//get all audit entries
app.get("/auditEntries", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {

        let requestedUser = req.user;
        if (!requestedUser.superAdmin) {
            return res.send({ "Message": "Unauthorized" });

        }

        const queryObject = url.parse(req.url, true).query;
        console.log(queryObject);

        let startDate = queryObject.startDate;
        let endDate = queryObject.endDate;
        console.log("start date is :" + queryObject.startDate);
        console.log("end date is :" + queryObject.endDate);
        console.log("current date is :" + new Date().toISOString());


        let propertiesToPopulate = ['user', 'provider', 'providerEntry', 'managingUser', 'createdBy'];
        let allAuditEntries = await AuditEntry.read({ createdAt: { "$gte": startDate, "$lt": endDate } }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredAllAuditEntries to store this filtered info.
        let filteredAllAuditEntries = [];

        //loop through the allAuditEntries array to filter each element in array
        for (let i = 0; i < allAuditEntries.length; i++) {

            //create new tempFilteredAllAuditEntries object to add none sensative info for request. 
            let tempFilteredAllAuditEntries = {

                _id: allAuditEntries[i]._id,
                createdAt: allAuditEntries[i].createdAt,
                //provider info set here
                provider: allAuditEntries[i].provider,

                //user info set here with sensative data filtered out
                createdBy: {
                    pushId: allAuditEntries[i].createdBy.pushId,
                    admin: allAuditEntries[i].createdBy.admin,
                    superAdmin: allAuditEntries[i].createdBy.superAdmin,
                    userType: allAuditEntries[i].createdBy.userType,
                    active: allAuditEntries[i].createdBy.active,
                    _id: allAuditEntries[i].createdBy._id,
                    createdAt: allAuditEntries[i].createdBy.createdAt,
                    updatedAt: allAuditEntries[i].createdBy.updatedAt,
                    fName: allAuditEntries[i].createdBy.fName,
                    lName: allAuditEntries[i].createdBy.lName,
                    email: allAuditEntries[i].createdBy.email,
                    phone: allAuditEntries[i].createdBy.phone,
                    title: allAuditEntries[i].createdBy.title,
                    __v: allAuditEntries[i].createdBy.__v
                },
                ref: allAuditEntries[i].ref,
                action: allAuditEntries[i].action,
                requestMethod: allAuditEntries[i].requestMethod,
                endpoint: allAuditEntries[i].endpoint,
                __v: allAuditEntries[i].__v
            }

            //add filtered data to filteredAllAuditEntries array
            filteredAllAuditEntries.push(tempFilteredAllAuditEntries);
        }

        // send filteredAllAuditEntries back to user request with filtered info
        res.send(filteredAllAuditEntries);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all audit entries by providerId
app.get("/auditEntries/providers/:providerId", passport.authenticate("jwt", { session: false }), async (req, res) => {


    try {
        //get provider id
        let providerId = req.params.providerId;


        let requestedUser = req.user;
        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if (!canMakeRequest) {
            return res.send({ "Message": "Unauthorized" });
        }

        let propertiesToPopulate = ['provider', 'createdBy'];
        let allProviderEntries = await AuditEntry.read({ provider: providerId }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredAllProviderEntries to store this filtered info.
        let filteredAllProviderEntries = [];

        //loop through the allProviderEntries array to filter each element in array
        for (let i = 0; i < allProviderEntries.length; i++) {

            //create new tempFilteredAllProviderEntries object to add none sensative info for request. 
            let tempFilteredAllProviderEntries = {

                _id: allProviderEntries[i]._id,
                createdAt: allProviderEntries[i].createdAt,
                //provider info set here
                provider: allProviderEntries[i].provider,

                //user info set here with sensative data filtered out
                createdBy: {
                    pushId: allProviderEntries[i].createdBy.pushId,
                    admin: allProviderEntries[i].createdBy.admin,
                    superAdmin: allProviderEntries[i].createdBy.superAdmin,
                    userType: allProviderEntries[i].createdBy.userType,
                    active: allProviderEntries[i].createdBy.active,
                    _id: allProviderEntries[i].createdBy._id,
                    createdAt: allProviderEntries[i].createdBy.createdAt,
                    updatedAt: allProviderEntries[i].createdBy.updatedAt,
                    fName: allProviderEntries[i].createdBy.fName,
                    lName: allProviderEntries[i].createdBy.lName,
                    email: allProviderEntries[i].createdBy.email,
                    phone: allProviderEntries[i].createdBy.phone,
                    title: allProviderEntries[i].createdBy.title,
                    __v: allProviderEntries[i].createdBy.__v
                },
                ref: allProviderEntries[i].ref,
                action: allProviderEntries[i].action,
                requestMethod: allProviderEntries[i].requestMethod,
                endpoint: allProviderEntries[i].endpoint,
                __v: allProviderEntries[i].__v
            }

            //add filtered data to filteredManagingUsers array
            filteredAllProviderEntries.push(tempFilteredAllProviderEntries);
        }

        res.send(filteredAllProviderEntries);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all audit entries by userId
app.get("/auditEntries/user/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {


    //todo: maybe let managing users access as well

    try {

        let requestedUser = req.user;
        if (!requestedUser.superAdmin) {
            return res.send({ "Message": "Unauthorized" });

        }

        //get user id
        let userId = req.params.userId;
        let propertiesToPopulate = ['user', 'provider', 'providerEntry', 'managingUser', 'createdBy'];
        let allProviderEntries = await AuditEntry.read({ createdBy: userId }, propertiesToPopulate);

        //The following code is used to filter out sensative user info.
        //create new array called filteredAllProviderEntries to store this filtered info.
        let filteredAllProviderEntries = [];

        //loop through the allProviderEntries array to filter each element in array
        for (let i = 0; i < allProviderEntries.length; i++) {

            //create new tempFilteredAllProviderEntries object to add none sensative info for request. 
            let tempFilteredAllProviderEntries = {

                _id: allProviderEntries[i]._id,
                createdAt: allProviderEntries[i].createdAt,
                //provider info set here
                provider: allProviderEntries[i].provider,

                //user info set here with sensative data filtered out
                createdBy: {
                    pushId: allProviderEntries[i].createdBy.pushId,
                    admin: allProviderEntries[i].createdBy.admin,
                    superAdmin: allProviderEntries[i].createdBy.superAdmin,
                    userType: allProviderEntries[i].createdBy.userType,
                    active: allProviderEntries[i].createdBy.active,
                    _id: allProviderEntries[i].createdBy._id,
                    createdAt: allProviderEntries[i].createdBy.createdAt,
                    updatedAt: allProviderEntries[i].createdBy.updatedAt,
                    fName: allProviderEntries[i].createdBy.fName,
                    lName: allProviderEntries[i].createdBy.lName,
                    email: allProviderEntries[i].createdBy.email,
                    phone: allProviderEntries[i].createdBy.phone,
                    title: allProviderEntries[i].createdBy.title,
                    __v: allProviderEntries[i].createdBy.__v
                },
                ref: allProviderEntries[i].ref,
                action: allProviderEntries[i].action,
                requestMethod: allProviderEntries[i].requestMethod,
                endpoint: allProviderEntries[i].endpoint,
                __v: allProviderEntries[i].__v
            }

            //add filtered data to filteredManagingUsers array
            filteredAllProviderEntries.push(tempFilteredAllProviderEntries);
        }


        //send filteredAllProvidersEntries back to user request
        res.send(filteredAllProviderEntries);

    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});






/*************END AUDIT ENTRY ENDPOINTS*****************/


/*************START PUSH ENDPOINTS*****************/
app.post("/push/globalPush", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get user that made the request
        let requestedUser = req.user;

        let body = req.body;

        //get title
        let title = body.title;
        let message = body.message;


        //only allow super admins to access all users
        if (!requestedUser.superAdmin) {
            return res.send({ "Message": "Unauthorized" });
        }

        let allUsers = await User.read();


        for (let i = 0; i < allUsers.length; i++) {
            let userObj = allUsers[i];
            let pushId = userObj["pushId"];

            if (pushId === "") continue;

            let data = {
                "to": pushId,
                "priority": "high",
                "notification": {
                    "body": message,
                    "title": title
                }
            };

            //todo: move to function and put key in env
            //todo: use fcm topics instead of looping through pushIds
            let key = "";

	           const config = {
		             "Content-Type": "application/json;charset=utf-8",
		             "Authorization": `key=${process.env.FCM_API_KEY}`	
             };
            const response = await axios({
                method: 'post',
                url: 'https://fcm.googleapis.com/fcm/send',
                data: data,
                headers: config
            });

        }



        res.send({ "Message": "Sent push successfully" });


    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});
/*************END PUSH ENDPOINTS*****************/



/*************SERVICES OFFERED ENDPOINTS*****************/

//Make endpoint that will create servicesoffered
app.post("/servicesoffered", passport.authenticate("jwt", { session: false}), async(req, res) => {

    try{ 

        let requestedUser = req.user;

        let providerId = req.body.providerId;
        if(!providerId){
            return res.send({"Message": "Missing Provider"});
        }

        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }

	//check to see if Servicesoffered info came through POST
	if( req.body.AvailableBeds
	    && req.body.TotalBeds
	    && req.body.VolunteerOpportunities
	    && req.body.VolunteersNeeded
	    && req.body.ServiceType
	    && req.body.ServicesDescription
	    && req.body.CriteriaForService
	    && req.body.WarmingStation
	    && req.body.CoolingStation
	    )
	{


	    let newServicesOfferedInfo = {
		AvailableBeds:  req.body.AvailableBeds,
		TotalBeds: req.body.TotalBeds,
		VolunteerOpportunities: req.body.VolunteerOpportunities,
		VolunteersNeeded: req.body.VolunteersNeeded,
		ServiceType: req.body.ServiceType,
		ServicesDescription: req.body.ServicesDescription,
		CriteriaForService: req.body.CriteriaForService,
		WarmingStation: req.body.WarmingStation,
		CoolingStation: req.body.CoolingStation,
		Provider: providerId
	    }

	    //now we create ServicesOffered doc and store in database
	    let newServicesOffered = await ServicesOffered.create(newServicesOfferedInfo);

            AuditEntry.addAuditEntry(requestedUser, newServicesOfferedInfo, "Create", "POST", "/servicesoffered", null, "ServicesOffered");

	    res.send({Message: "ServicesOffered created successfully", newServicesOffered});

	}
        else{
	    res.send({Message: "Invalid info" });
        }

        
    }catch(err){
	console.log(err);
	res.send(err);
    }
});

//Make endpoint that returns all servicesoffered
app.get("/servicesoffered", async(req, res) =>{

    try{
        //call function to read user database info
        let propertiesToPopulate = ['Provider'];
        let allservicesofferedDocs = await ServicesOffered.read(null, propertiesToPopulate);
        res.send(allservicesofferedDocs);

    }catch(err){
        //send error if unable to execute
        console.log(err);
        res.send(err);
    }
})

//Make endpoint that returns servicesoffered by id
app.get("/servicesoffered/:servicesofferedId", async(req, res) =>{

    try{
        let id = req.params.servicesofferedId;
        //call function to read user database info
        let propertiesToPopulate = ['Provider'];
        let servicesOfferedDocs = await ServicesOffered.read({ _id: id}, propertiesToPopulate);
        let servicesOfferedDoc = servicesOfferedDocs[0];
        res.send(servicesOfferedDoc);

    }catch(err){
        //send error if unable to execute
        console.log(err);
        res.send(err);
    }
})

//create a endpoint to update servicesoffered
app.put("/servicesoffered/:servicesofferedId", 	passport.authenticate("jwt", { session: false}), async(req, res) =>{
    try{

        let requestedUser = req.user;

        let providerId = req.body.providerId;
        if(!providerId){
            return res.send({"Message": "Missing Provider"});
        }

        let canMakeRequest = await ManagingUser.checkIfActiveManagingUser(requestedUser, providerId);
        if(!canMakeRequest){
            return res.send({"Message": "Unauthorized"});
        }

	//get the id to use
	let id = req.params.servicesofferedId;
	//now find the servicesoffered doc
	let servicesOfferedDocs = await ServicesOffered.read({ _id: id });
	let servicesOfferedDoc = servicesOfferedDocs[0];

	if(servicesOfferedDoc){

	    //look at the Post req.body for the data used to update this provider document
	    let updateInfo = {};
	    if(req.body.AvailableBeds){
		updateInfo["AvailableBeds"] = req.body.AvailableBeds;
	    }
	    if(req.body.TotalBeds){
		updateInfo["TotalBeds"] = req.body.TotalBeds;
	    }
	    if(req.body.VolunteerOpportunities){
		updateInfo["VolunteerOpportunities"] = req.body.VolunteerOpportunities;
	    }
	    if(req.body.VolunteersNeeded){
		updateInfo["VolunteersNeeded"] = req.body.VolunteersNeeded;
	    }
	    if(req.body.ServiceType){
		updateInfo["ServiceType"] = req.body.ServiceType;
	    }
	    if(req.body.ServicesDescription){
		updateInfo["ServicesDescription"] = req.body.ServicesDescription;
	    }
	    if(req.body.CriteriaForService){
		updateInfo["CriteriaForService"] = req.body.CriteriaForService;
	    }
	    if(req.body.WarmingStation){
		updateInfo["WarmingStation"] = req.body.WarmingStation;
	    }
	    updateInfo["updatedAt"] = Date();

	    //update database for user
	    let updatedServicesOfferedDoc = await ServicesOffered.update(servicesOfferedDoc, updateInfo);
	    res.send({ message: "Update ServicesOffered doc a success.", updatedServicesOfferedDoc});

	}else{
	    res.send({ message: "Could not find user to be updated."});
	}


    }catch(err){
        console.log(err);
        res.send(err);
    }
});

//make endpoint to delete one servicesoffered by id
app.delete("/servicesoffered/:servicesofferedId", 	passport.authenticate("jwt", { session: false}), async(req, res) => {
    try{

        let requestedUser = req.user;

        if(!requestedUser.superAdmin && !requestedUser.active){
           return res.send({"Message": "Unauthorized"});
        }

	//get user id
	let id = req.params.servicesofferedId;
	
	//first find the one Provider doc
	let servicesOfferedDocs = await ServicesOffered.read({ _id: id });
	let servicesOfferedDoc = servicesOfferedDocs[0];

	//verify we have both providerId and providerDoc 
	if(id && servicesOfferedDoc){
	//now delete the one doc
	let deletedServicesOfferedDoc = await ServicesOffered.delete(servicesOfferedDoc);
	res.send({ message: "Delete was a success.", deletedServicesOfferedDoc});
	}else{
	    res.send({ message: "Could not find user"});
	}

    
    }catch(err){
        console.log(err);
        res.send(err);
    }
})

/*************END SERVICES OFFERED ENDPOINTS*****************/



/*************THIRD PARTY APP ENDPOINTS*****************/

//update third party app
app.put("/thirdPartyApp/:appId", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get provider id
        let appId = req.params.appId;


        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
         }
 

        let allThirdPartyApps = await ThirdPartyApp.read({ _id: appId });
        //check if third party app exists
        if (allThirdPartyApps.length > 0) {
            let thirdPartyDoc = allThirdPartyApps[0];

            let body = req.body;
            let activeStatusToSet = body.active;
            if(!activeStatusToSet){
                return res.send({"Message": "Missing Active Status"});
            }

            await AuditEntry.addAuditEntry(requestedUser, req.body, "Update", "PUT", "/thirdPartyApp/:appId", thirdPartyDoc, "ThirdPartyApp");

            let updateFields = body;
            updateFields.updatedAt = Date.now();
            let updatedThirdPartyApp = await Provider.update(thirdPartyDoc, updateFields);
            res.send({ "Message": "Updated Third Party App successfully", provider: updatedThirdPartyApp });
        }
        else {
            res.send({ "Message": "Third Party App doesn't exist" });
        }
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});


//get all third party apps
app.get("/thirdPartyApp/", passport.authenticate("jwt", { session: false }), async (req, res) => {

    try {
        //get provider id
        let requestedUser = req.user;
        if(!requestedUser.superAdmin && !requestedUser.active){
            return res.send({"Message": "Unauthorized"});
         }
 

        let allThirdPartyApps = await ThirdPartyApp.read();
        //check if third party apps exist
        if (allThirdPartyApps.length > 0) {
            res.send(allThirdPartyApps);
        }
        else {
            res.send({ "Message": "Third Party App doesn't exist" });
        }
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }

});

/*************END THIRD PARTY APP ENDPOINTS*****************/
