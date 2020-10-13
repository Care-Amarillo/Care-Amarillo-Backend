// Using ES6 imports
import mongoose from 'mongoose';
import './dbconnection.js'; 

import User from './user.js';

import './config.js'

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
            "email": process.env.INITIAL_ADMIN_USER_EMAIL,
            "phone": "8062345383",
            "title": "Super Admin",
            "password": process.env.INITIAL_ADMIN_USER_PASSWORD
          }

        let encryptedPasswordAndSalt = await User.generateHash(process.env.INITIAL_ADMIN_USER_PASSWORD);
        let encryptedPassword = encryptedPasswordAndSalt.encryptedString;
        let salt = encryptedPasswordAndSalt.salt;
        user.password = encryptedPassword;
        user.salt = salt;

        //call addUser to save the new usser to the database
        await User.create(user);


       



    }
    catch(error){
        console.log(`main error: ${error}`);
    }
}


main();