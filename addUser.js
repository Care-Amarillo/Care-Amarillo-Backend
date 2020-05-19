// Using ES6 imports
import mongoose from 'mongoose';
import './dbconnection.js'; 

import User from './user.js';

mongoose.Promise = global.Promise;





const main = async() => {

    try{

       

        /***********************************************************************************/
        //create new user object
        const user = {
            "admin": false,
            "superAdmin": true,
            "userType": 3,
            "active": true,
            "fName": "Tommy",
            "lName": "Johnson",
            "email": "tester@amarillocollege.com",
            "phone": "8062345383",
            "title": "Super Admin",
            "password": "test"
          }

        //call addUser to save the new usser to the database
        await User.create(user);


       



    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();