/* index.ts - The framework's entry file
In bootstrap you basically set everything up that needs to be there before anything else can run
Like setting up a database connection
*/
import {Database} from "./database";

let DB;

class Framework {
    bootstrap(DBOptions: any) : Promise<any> {
        return new Promise(async (resolve, reject) => {
            DB = new Database();

            await DB.init(DBOptions);

            resolve();
        })
    }

    get DB() {
        return DB;
    }
}

// Exporting like this makes it so you dont have to instantiate the framework where you load it
// Why? Cause (afaik) the framework will only be loaded once per project
// Its not like a model
export let framework = new Framework();