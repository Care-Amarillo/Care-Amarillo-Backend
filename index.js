// Using ES6 imports
import mongoose from 'mongoose';
import './dbconnection.js'; 

import Provider from './provider.js';
import User from './user.js';
import ProviderEntry from './providerEntry.js';
import ManagingUser from './managingUser.js';

mongoose.Promise = global.Promise;





const main = async() => {

    try{

       

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
        await User.create(user);


       

        //get and print the providers in the database
        let allUsers = await User.read();
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
         await Provider.create(provider);

         //get and print the providers in the database
        let allProviders = await Provider.read();
        console.log("All providers: "  +  allProviders)


        /***********************************************************************************/
        //get first user and updateProfile info
        const firstUser = allUsers[0];
        let updatedFirstUser = firstUser;
        updatedFirstUser.fName = "Timmy";
        await User.update(firstUser, updatedFirstUser);


        /***********************************************************************************/
         //get and print the providers in the database
         allUsers = await User.read();
         console.log("All users: "  +  allUsers);

         //add managingUser
         const managingUser = new ManagingUser();
         managingUser.provider = allProviders[0]._id;
         managingUser.user = allUsers[0]._id;

        await ManagingUser.create(managingUser);

        /***********************************************************************************/

         //get and print the users from latest insert  in the database
        let allManagingUsersFromLatest = await ManagingUser.read(null,['user','provider']);
        console.log("All managers users from latest id: "  +  allManagingUsersFromLatest);


         //get and print the users from latest insert  in the database
        let allProvidersFromLatest = await ManagingUser.read({_id: allManagingUsersFromLatest[0]._id},['user','provider']);
        console.log("All managingUsers from latest id: "  +  allProvidersFromLatest)

        /***********************************************************************************/
        //get previous beds used
        let prevBeds = provider.bedsUsed;
        //change beds count
        let newProviderToAdd = provider;
        newProviderToAdd.bedsUsed = 4;
        //get change count
        let changeCount = 0;

        if(prevBeds > provider.bedsUsed){
            changeCount = prevBeds - provider.bedsUsed;
        }
        else{
            changeCount = provider.bedsUsed - prevBeds;
        }
        await Provider.update(allProviders[0], newProviderToAdd);

        //add bed change to provider entries
        const providerEntry = new ProviderEntry();
        //get objectId to add to provider
        const idToSearch = new mongoose.Types.ObjectId(provider._id);
        providerEntry.amountChanged = changeCount;
        providerEntry.provider = idToSearch;
        //add provider entry
        await ProviderEntry.create(providerEntry);


          //get and print the provider entries
        let allProvidersEntries = await ProviderEntry.read(null,['provider']);
        console.log("All providers : "  +  allProvidersEntries)

        /***********************************************************************************/

        //get previous beds used
        prevBeds = provider.bedsUsed;
        //change beds used and update capacity again
        newProviderToAdd.bedsUsed = 6;
        changeCount = prevBeds - provider.bedsUsed;
        await Provider.update(allProviders[0], newProviderToAdd);

         //add bed change to provider entries
         const providerEntryTwo = new ProviderEntry();
         //get objectId to add to provider
         providerEntryTwo.amountChanged = changeCount;
         providerEntryTwo.provider = idToSearch;
         //add provider entry
        await ProviderEntry.create(providerEntryTwo);
        /***********************************************************************************/

        //get and print the provider entries
        let allProvidersEntriesFromLatest = await ProviderEntry.read({_id: allProvidersEntries[0]._id},['provider']);
        console.log("All providers from latest : "  +  allProvidersEntriesFromLatest);


    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();