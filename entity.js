export default class Entity {
    // This Entity class will serve as the parent class for all model-like children classes 

    //  create function
    static async create(theProperties) {
        // Assume that theProperties parameter is a JSON object containing the properties to use in creating a document
        try {
            // instantiate a new model of whatever the child class is representing
            let newModel = new this.model();
            // Get all of the properties in theProperties parameter and assign them to the new model object.
            for(let [key, value] of Object.entries(theProperties)) {
                newModel[key] = value;
            }
            // Now save the Mongoose model.
            return newModel.save();
        } catch (err) {
            console.log(err);
        }
    }

    // read
    static async read(filter, relationshipsToPopulate) {
        // filter is a json object to actually filter model.find()
        // relationshipsToPopulate is an array of the names of teh properties that contain teh linking relationships for this model.
        try {
                let query = null;   // this will hold the Query object returned from find()
                // Handle the situation where filter is available.
                if(filter) {    
                    query = this.model.find(filter);    
                } else {
                    query = this.model.find();
                }
                // Now handle the situation where we need to populate relationships
                if(relationshipsToPopulate) {
                    for(let i = 0; i < relationshipsToPopulate.length; i++) {
                        query = query.populate(relationshipsToPopulate[i]);
                    }
                }
                return query.exec();
        } catch (err) {
            console.log(err);
        }
    }

    // define update
    static async update(theDocToBeUpdated, theUpdatedInfo) {
        // theDocToBeUpdate is an actual Mongoose Document Model object (like something returned from a read() or create())
        // theUpdatedInfo is JSON object that contains the properties and values to be modified
        try {
            // modify the properties of theDocToBeUpdated with the properties of theUpdatedInfo
            for(let [key, value] of Object.entries(theUpdatedInfo)) {
                theDocToBeUpdated[key] = value;
            }
            return theDocToBeUpdated.save();
        } catch (err) {
            console.log(err);
        }
    }

    // define delete
    static async delete(theActualDoc) {
        // theActualDoc is an actual Mongoose Document Model object (like what is returned from create(), read(), even update())
        try {
            return theActualDoc.delete();
        } catch (err) {
            console.log(err);
        }
    }
}