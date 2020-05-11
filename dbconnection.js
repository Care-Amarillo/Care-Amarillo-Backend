import mongoose from "mongoose";
import { truncate } from "fs";

class DBConnection {
    constructor() {
        const mongoDBUrl = "localhost";
        const mongoDBPort = "27017";
        const mongoDBDatabase = "CareAmarilloDB";

        const connectionInfo = `mongodb://${mongoDBUrl}:${mongoDBPort}/${mongoDBDatabase}`;
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