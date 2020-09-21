import User from './user.js';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportJWT from 'passport-jwt';

const JWTStrategy = passportJWT.Strategy;
const LocalStrategy = passportLocal.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
},
//handle authentication
async function(email, password, callback) {
    // check the User's password and email
    try {
        let theUserDocs = await User.read({ email: email });
        let theUserDoc = theUserDocs[0];
        let authresult = await User.authenticate(password, theUserDoc);
        if(authresult) {

            let newModel = {}
            for(let [key, value] of Object.entries(theUserDoc.toJSON())) {
                if(key == "password" || key == "salt") continue;
                newModel[key] = value;
            }


            // login success.
            return callback(null, newModel, { message: "The User logged in successfully." });
        } else {
            // login failed.
            return callback(null, false, { message: "Incorrect email or password." });
        }
    } catch (err) {
        console.log(err);
        (err) => callback(err);
    }
}
));

// config Passport to verify any generated JWTs
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    // Recommended to use a key, instead of a password.
    secretOrKey: process.env.JWT_KEY_OR_SECRET 
},

//verify  JWT
function (JWT, callback) {
    // do any additoinal checking here in this function, if needed.
    return callback(null, JWT);
}
));
