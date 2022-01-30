import mongoose from "mongoose";
import { truncate } from "fs";

//import env variables
import './config.js';

class DBConnection {
    constructor() {
        const mongoDBUrl = process.env.MONGO_URL;
        const mongoDBPort = process.env.MONGO_PORT;
        const mongoDBDatabase = "CareAmarilloDB";

        //const connectionInfo = `mongodb://${mongoDBUrl}:${mongoDBPort}/${mongoDBDatabase}`;
	const connectionInfo = process.env.MONGO_ATLAS_URL;
        const mongodDBConfig = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        mongoose.connect(connectionInfo, mongodDBConfig).then(() => {
            console.log("Connected to MongoDB!");
        });
    }
}

export default new DBConnection();
