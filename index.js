// Using ES6 imports
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;
//objectId, not really needed, created by default
// const ObjectId = mongoose.Types.ObjectId;

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
    active: {type: "Boolean", default: false, required:true}

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
    provider: {type: mongoose.Schema.Types.ObjectId, ref:'Provider', required: true},
    createdAt: {type: "Date", default: Date.now, required: true},
    updatedAt: {type: "Date", default: Date.now, required: true}

});

//create provider entry model
const ProviderEntry = mongoose.model("ProviderEntry", providerEntrySchema, "ProviderEntries");


//managing user schema
const managingUserSchema = new Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    provider: {type: mongoose.Schema.Types.ObjectId, ref:'Provider', required: true},
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
        //save user to database
        let savePromise = newUser.save();  
       
        //return promise so we can print it after save
        return savePromise;
       
    }
    catch (err) {
        console.log(err);
    }
}


// Update an user's profile
const updateUserProfile = async(userObj) => {  
    try {
       
        let foundUserDoc = await User.findById(userObj._id).exec();  
        foundUserDoc.fName = userObj.fName;
        foundUserDoc.lName = userObj.lName;
        foundUserDoc.email = userObj.email;
        foundUserDoc.phone = userObj.phone;
        foundUserDoc.title = userObj.title;
        foundUserDoc.active = userObj.active;
        let updatePromise = foundUserDoc.save(); 
        return updatePromise;
        
    }
    catch (err) {
        console.log(err);
    }
}


// Update an user's active status
// equivalent to deactivating or deleting an user. 
const updateUserStatus = async(userId, active) => {  
    try {
       
        let foundUserDoc = await User.findById(userId).exec();  
        foundUserDoc.active = active;
        let updatePromise = foundUserDoc.save(); 
        return updatePromise;
        
    }
    catch (err) {
        console.log(err);
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


// Update an user's profile
const updateProviderProfile = async(providerObj) => {  
    try {
       
        let foundProviderDoc = await Provider.findById(providerObj._id).exec();  
        foundProviderDoc.name = providerObj.name;
        foundProviderDoc.address = providerObj.address;
        foundProviderDoc.zip = providerObj.zip;
        foundProviderDoc.lat = providerObj.lat;
        foundProviderDoc.long = providerObj.long;
        foundProviderDoc.email = providerObj.email;
        foundProviderDoc.phone = providerObj.phone;
        foundProviderDoc.title = providerObj.title;
        foundProviderDoc.active = providerObj.active;
        let updatePromise = foundProviderDoc.save(); 
        return updatePromise;
        
    }
    catch (err) {
        console.log(err);
    }
}


// Update an user's profile
const updateProviderCapacity = async(providerObj) => {  
    try {
       
        let foundProviderDoc = await Provider.findById(providerObj._id).exec();  
        foundProviderDoc.bedsUsed = providerObj.bedsUsed;
        foundProviderDoc.totalBeds = providerObj.totalBeds;
        let updatePromise = foundProviderDoc.save(); 
        return updatePromise;

       
        
    }
    catch (err) {
        console.log(err);
    }
}


// Update an providers's active status
// equivalent to deactivating or deleting a provider. 
const updateProviderStatus = async(providerId, active) => {  
    try {
       
        let foundProviderDoc = await Provider.findById(providerId).exec();  
        foundProviderDoc.active = active;
        let updatePromise = foundProviderDoc.save(); 
        return updatePromise;
        
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
          return User.find({active:true}).exec();

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
        return Provider.find({active:true}).exec();
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


//get all managing users from the ManagingUser collection, with a certain provider id
const getProviderEntriesByProviderId = async(providerId) => {
    try{
        const idToSearch = new mongoose.Types.ObjectId(providerId);
        //return Promise
        return ProviderEntry.find({provider: idToSearch}).populate('provider').exec();

    }
    catch(err){
        console.log("error getting all managing users is " + err);

    }

}

 //get all managing users from the ManagingUser collection, with a certain provider id
const getManagingUserByProviderId = async(providerId) => {
    try{
        const idToSearch = new mongoose.Types.ObjectId(providerId);
        //return Promise
        return ManagingUser.find({provider: idToSearch}).populate('user').populate('provider').exec();

    }
    catch(err){
        console.log("error getting all managing users is " + err);

    }

}


 //get all managing users from the ManagingUser collection, with a certain provider id
 const getManagingUserByUserId = async(userId) => {
    try{
        const idToSearch = new mongoose.Types.ObjectId(userId);
        //return Promise
        return ManagingUser.find({provider: idToSearch}).populate('user').populate('provider').exec();

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
       

        /***********************************************************************************/
        //create new user object
        const user = new User();
        user.fName = "Fred";
        user.lName = "Johnson";
        user.email =  "fred.johnson@amarillocollege.com";
        user.phone =  "8062345383";
        user.active =  true;
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

       

        /***********************************************************************************/
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
        //  provider.changedBy = user._id;
 
         //call addProvider to save the new provider to the database
         await addProvider(provider);

         //get and print the providers in the database
        let allProviders = await getAllProviders();
        console.log("All providers: "  +  allProviders)


        /***********************************************************************************/
        //get first user and updateProfile info
        const firstUser = allUsers[0];
        firstUser.fName = "Timmy";
        await updateUserProfile(firstUser);


        /***********************************************************************************/
         //get and print the providers in the database
         allUsers = await getAllUsers();
         console.log("All users: "  +  allUsers);

         //add managingUser
         const managingUser = new ManagingUser();
         managingUser.provider = provider._id;
         managingUser.user = user._id;

         await addManagingUser(managingUser);

        /***********************************************************************************/

         //get and print the users from latest insert  in the database
        let allManagingUsersFromLatest = await getAllManagingUsers();
        console.log("All managers users from latest id: "  +  allManagingUsersFromLatest);


         //get and print the users from latest insert  in the database
        let allProvidersFromLatest = await getManagingUserByProviderId(provider._id);
        console.log("All providers from latest id: "  +  allProvidersFromLatest)

        /***********************************************************************************/
        //get previous beds used
        let prevBeds = provider.bedsUsed;
        //change beds count
        provider.bedsUsed = 4;
        //get change count
        let changeCount = 0;

        if(prevBeds > provider.bedsUsed){
            changeCount = prevBeds - provider.bedsUsed;
        }
        else{
            changeCount = provider.bedsUsed - prevBeds;
        }
        await updateProviderCapacity(provider);

        //add bed change to provider entries
        const providerEntry = new ProviderEntry();
        //get objectId to add to provider
        const idToSearch = new mongoose.Types.ObjectId(provider._id);
        providerEntry.amountChanged = changeCount;
        providerEntry.provider = idToSearch;
        //add provider entry
        await addProviderEntry(providerEntry);


          //get and print the provider entries
        let allProvidersEntries = await getAllProviderEntries();
        console.log("All providers : "  +  allProvidersEntries)

        /***********************************************************************************/

        //get previous beds used
        prevBeds = provider.bedsUsed;
        //change beds used and update capacity again
        provider.bedsUsed = 6;
        changeCount = prevBeds - provider.bedsUsed;
        await updateProviderCapacity(provider);

         //add bed change to provider entries
         const providerEntryTwo = ProviderEntry();
         //get objectId to add to provider
         providerEntryTwo.amountChanged = changeCount;
         providerEntryTwo.provider = idToSearch;
         //add provider entry
         await addProviderEntry(providerEntryTwo);
        /***********************************************************************************/

        //get and print the provider entries
        let allProvidersEntriesFromLatest = await getProviderEntriesByProviderId(provider._id);
        console.log("All providers from latest : "  +  allProvidersEntriesFromLatest);


    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();