// Using ES6 imports
import mongoose from 'mongoose';
import './dbconnection.js'; 
import ThirdPartyApp from './thirdPartyApps.js';


mongoose.Promise = global.Promise;


const main = async() => {

    try{

        /***********************************************************************************/
        //create new app object
        const googleSheets = {
            "name": "Google Sheets API",
            "active": false,
        }

        //call create to save the new app to the database
        await ThirdPartyApp.create(googleSheets);

        const googleFCM = {
            "name": "Google FCM Push",
            "active": false,
        }

        //call create to save the new app to the database
        await ThirdPartyApp.create(googleFCM);

        const googleAutocomplete = {
            "name": "Google Autocomplete API",
            "active": false,
        }

        //call create to save the new app to the database
        await ThirdPartyApp.create(googleAutocomplete);

        const googleMapsEmbed = {
            "name": "Google Maps Embed API",
            "active": false,
        }

        //call create to save the new app to the database
        await ThirdPartyApp.create(googleMapsEmbed);

    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();