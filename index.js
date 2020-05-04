// Using ES6 imports
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;
//objectId, not really needed, created by default
const ObjectId = mongoose.ObjectId;

const mongoDBUrl = "localhost";
const mongoDBPort = "27017";
const mongoDBDatabase = "CareAmarilloDB";

//user schema
const userSchema = new Schema({
    fName: {type: "String", required: true},
    lName: {type: "String", required: true},
    email: {type: "String", required:true}, 
    phone: {type: "String", required: true},
    title: {type: "String", required: true},
    admin: {type: "Boolean", default: false, required: true},
    userType: {type: "Number", default:1, required: true},
    createdAt: {type: "Date", default: Date.now, required: true},
    updatedAt: {type: "Date", default: Date.now, required: true},
    status: {type: "Boolean", default: false, required:true}

});

//create user model
const User = mongoose.model("User", userSchema, "Users");


//provider schema
const providerSchema = new Schema({
    name: {type: "String", required: true},
    lat: {type: "String", required: true},
    long: {type: "String", required: true},
    address: {type: "String", required: true},
    email: {type: "String", required:true}, 
    phone: {type: "String", required: true},
    title: {type: "String", required: true},
    zip: {type: "String",  required: true},
    type: {type: "Number", default:1, required: true},
    timesUpdated: {type: "Number", default: 0, required: true},
    bedsUsed: {type: "Number", default: 0, required: true},
    totalBeds: {type: "Number", default: 0, required: true},
    createdAt: {type: "Date", default: Date.now, required: true},
    updatedAt: {type: "Date", default: Date.now, required: true},
    active: {type: "Boolean", default: false, required:true}

});

//create provider model
const Provider = mongoose.model("Provider", providerSchema, "Providers");

//provider entry schema
//every time a provider adds or removes a bed, this will get updated
const providerEntrySchema = new Schema({
    amountChanged: {type: "Number", default: 0, required: true},
    providerName: {type: "String",  required: true},
    providerId: {type: mongoose.Schema.Types.ObjectId,  required: true},
    createdAt: {type: "Date", default: Date.now, required: true},
    updatedAt: {type: "Date", default: Date.now, required: true}

});

//create provider entry model
const ProviderEntry = mongoose.model("ProviderEntry", providerEntrySchema, "ProviderEntries");


//managing user schema
const managingUserSchema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId,  required: true},
    providerName: {type: "String",  required: true},
    userName: {type: "String",  required: true},
    providerId: {type: mongoose.Schema.Types.ObjectId,  required: true},
    createdAt: {type: "Date", default: Date.now, required: true},
    updatedAt: {type: "Date", default: Date.now, required: true}

});

//create managing user model
const ManagingUser = mongoose.model("ManagingUser", managingUserSchema, "ManagingUser");

// Add a new User document
const addUser = async(userObj) => { 
    try {
        //create new user object 
        const newUser = new User(userObj); 
        //save student to database
        let savePromise = newUser.save();  
       
        //return promise so we can print it after save
        return savePromise;
       
    }
    catch (err) {
        console.log(err);
    }
}


// Update a User document
const updateUser = async(userObj) => {
    try{

        //return Promise
        return User.findOneAndUpdate(userObj.Id, userObj,  { overwrite: true }).exec();
    }
    catch(err){
        console.log("error updating users is " + err);

    }

}



// Add a new Provider document
const addProvider = async(providerObj) => { 
    try {


        //create new provider object 
        const newProvider = new Provider(providerObj); 
        //save provider to database
        let savePromise = newProvider.save();  
       
        //return promise so we can print it after save
        return savePromise;
       
    }
    catch (err) {
        console.log(err);
    }
}


// Add a new Provider document
const addProviderEntry = async(providerEntryObj) => { 
    try {



        //create new provider entry object 
        const newProviderEntry = new ProviderEntry(providerEntryObj); 
        //save provider entry to database
        let savePromise = newProviderEntry.save();  
       
        //return promise so we can print it after save
        return savePromise;
       
    }
    catch (err) {
        console.log(err);
    }
}




// Add a new ManagingUser document
const addManagingUser = async(managingUserObj) => { 
    try {


        //create new managing user object 
        const newManagingUser = new ManagingUser(managingUserObj); 
        //save managing user to database
        let savePromise = newManagingUser.save();  
       
        //return promise so we can print it after save
        return savePromise;
       
    }
    catch (err) {
        console.log(err);
    }
}


  //get all users from the User collection
  const getAllUsers = async() => {
      try{
          //return Promise
          return User.find().exec();
      }
      catch(err){
          console.log("error getting all users is " + err);

      }

  }



  //get an user with an ObjectId from the User collection
  const getUserWithId = async(objectId) => {
    try{
        //return Promise
        return User.findById(objectId).exec();
    }
    catch(err){
        console.log("error getting all users is " + err);

    }

}


   //get all providers from the Provider collection
   const getAllProviders = async() => {
    try{
        //return Promise
        return Provider.find().exec();
    }
    catch(err){
        console.log("error getting all providers is " + err);

    }

}

//get a provider with an object id from the Provider collection
const getProviderWithId = async(id) => {
    try{
        //return Promise
        return Provider.findById(id).exec();
    }
    catch(err){
        console.log("error getting all providers is " + err);

    }

}


//get all provider entries from the ProviderEntry collection
const getAllProviderEntries = async() => {
    try{
        //return Promise
        return ProviderEntry.find().exec();
    }
    catch(err){
        console.log("error getting all provider entries is " + err);

    }

}


//get all managing users from the ManagingUser collection
const getAllManagingUsers = async() => {
    try{
        //return Promise
        return ManagingUser.find().exec();
    }
    catch(err){
        console.log("error getting all managing users is " + err);

    }

}


  

//connect to the database
const connectToDB = async() => {
    try{
        const connectionInfo = `mongodb://${mongoDBUrl}:${mongoDBPort}/${mongoDBDatabase}`;
        const mongoDBConfigObject = {
            useNewUrlParser : true,
            useUnifiedTopology : true
        }
       await mongoose.connect(connectionInfo, mongoDBConfigObject );
    }
    catch(err){
        console.log(err);
    }
}

const main = async() => {

    try{

        await connectToDB();
       

        //create new user object
        const user = new User();
        user.fName = "Fred";
        user.lName = "Johnson";
        user.email =  "fred.johnson@amarillocollege.com";
        user.phone =  "8062345383";
        user.status =  true;
        user.admin =  false;
        user.userType =  1;
        user.title =  "Manager";
        user.createdAt =  Date.now();
        user.updatedAt =  Date.now();

        //call addUser to save the new usser to the database
        await addUser(user);


       

        //get and print the providers in the database
        let allUsers = await getAllUsers();
        console.log("All users: "  +  allUsers);

       

         //create new Provider object
         const provider = new Provider();
         provider.name = "Panhandle Services";
         provider.lat= "34.000";
         provider.long= "-34.000";
         provider.email =  "info@panhandleservices.com";
         provider.phone =  "8062348888";
         provider.active =  true;
         provider.address =  "3300 S Polk";
         provider.zip =  "79107";
         provider.type =  1;
         provider.totalBeds =  32;
         provider.bedsUsed =  0;
         provider.title =  "Best Services In Town";
         provider.createdAt =  Date.now();
         provider.updatedAt =  Date.now();
 
         //call addProvider to save the new provider to the database
         await addProvider(provider);

         //get and print the providers in the database
        let allProviders = await getAllProviders();
        console.log("All providers: "  +  allProviders)


        const firstUser = allUsers[0];
        firstUser.fName = "Timmy";
        await updateUser(firstUser);


         //get and print the providers in the database
         allUsers = await getAllUsers();
         console.log("All users: "  +  allUsers);


    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();