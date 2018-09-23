let r;
let dbOptions;
let ready: boolean = false;

export class Database {
    init(options) : Promise<any> {
        return new Promise(async (resolve, reject) => {
            r = require('rethinkdbdash')(options);
            dbOptions = options;
            ready = true;
            resolve();
        })
    }

    get options() {
        return dbOptions;
    }

    tableList() {
        return r.tableList();
    }

    get r() {
        return r;
    }

    get ready() { //hehe
        return ready;
    }
}