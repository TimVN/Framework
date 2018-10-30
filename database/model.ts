/* model.ts - The base model for every model that contains the underlying logic
I have decided to not be a faggot and comment what I'm doing here
So you'll be able to understand faster/more easily
fucking goed framework
*/
import {Database} from "./";
import {Repository, RelationTypes} from "./repository";
import Aigle from 'aigle';

// Check repository to see what that is used for
const db = new Database();
const repository = new Repository();

export default class Model {
    public Table;
    public PrimaryKey;
    public DBProperties;
    public Properties;

    private _Query;
    private child;
    public data;

    constructor(data: any) {
        this.DBProperties = [];
        this.child = this.constructor;

        // Instead of using that decorator we pulled our hair out on
        // The basemodel just sets the properties when it gets fed with them
        if (data!==null) {
            this.DBProperties = Object.keys(data);
            Object.keys(data).forEach(property => {
                if (this.hasOwnProperty(property)) {
                    throw new Error(`Property ${property} already exists`);
                }
                this[property] = data[property];
            });
        }
    }

    get Query() {
        return this._Query || this.r.table(this.Table);
    }

    set Query(q) {
        this._Query = q;
    }

    // Exposes the "raw" RethinkDB instance
    get r() {
        return db.r;
    }

    run({ includeRelations = true, forceArray = false } = {}): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let results = await this.Query.run();
            results = Array.isArray(results) ? results : [results];

            if (includeRelations) {
                results = await this.resolveRelations(results);
            }

            if (results.length > 1 || forceArray) {
                resolve(
                    results.map(res => {
                        return new this.child(res);
                    })
                );
            } else {
                resolve(new this.child(results[0]));
            }
        });
    }

    // This does what you think it does, there is one big difference though
    // By default, it will return any relations it may have and their values
    // The reason it can be disabled, is because the save() function calls .json() as well
    // And because you don't want to store joined data in one table, you can opt out so it won't return them
    json({ includeRelations = true, exclude = [] } = {}) {
        let _tmp = {};

        Object.keys(this.Properties).forEach(p => {
            if (!exclude.includes(p)) {
                _tmp[p] = this.hasOwnProperty(p) ? this[p] : this.Properties[p];
            }
        });

        if (includeRelations) {
            let relations = repository.getRelations(this.Table);

            // I will explain why I use Aigle more down
            // This returns the data that was loaded through relations. If a constructor (model) was passed to the join function
            // The data that is in the relations are instances of that model. We check if that is the case
            // If yes, we can run .json() on the nested model. Recursion handles the rest
            Aigle.map(relations, relation => {
                const rel = relation.identifier;
                if (this[rel] && !exclude.includes(rel)) {
                    if (Array.isArray(this[rel])) {
                        _tmp[rel] = this[rel].map(i => {
                            return i.json({ includeRelations, exclude });
                        });
                    } else {
                        _tmp[rel] = typeof this[rel].json === "function" ? this[rel].json({
                            includeRelations,
                            exclude
                        }) : this[rel];
                    }
                }
            });
        }

        return _tmp;
    }

    // This simply gets all the entries in the table
    // Also (tries) to load relations
    // Skipping relations is optional, for when you don't really need the related data
    all() : any {
        this.Query = db.r.table(this.Table);
        return this;
    }

    // Same as .all() except for 1 entry
    get(id: string) : any {
        this.Query = db.r.table(this.Table).get(id);
        return this;
    }

    filter(filter: any = {}) {
        this.Query = this.Query.filter(filter);
        return this;
    }

    match(prop: string, value: any) {
        this.Query = this.Query.filter(function(doc) {
            return doc(prop).match(value)
        });
        return this;
    }

    skip(to: number) {
        this.Query = this.Query.skip(to);
        return this;
    }

    limit(to: number) {
        this.Query = this.Query.limit(to);
        return this;
    }

    find(index: number = 1, includeRelations = true) : any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).limit(index);

            if (includeRelations) {
                data = await this.resolveRelations(data);
                data = data.length > 0 ? data[0] : data;
            }

            resolve(data ? new this.child(data) : new this.child());
        });
    }

    getAll(value: number | string, index: string) {
        this.Query = this.Query.getAll(value, { index: index });
        return this;
    }

    count() {
        return this.Query.count().run();
    }

    range(start: number, finish: number) {
        if (finish - start < 1) {
            throw new Error(`Finish of range must be greater than start on ${this.Table}`);
        }
        this.Query = this.Query.skip(start).limit(finish - start);
        return this;
    }

    findByIndex(value: any, index: any, filter: any = null): any {
        this.Query = this.Query.getAll(value, { index: index });
        return this;
    }

    findOneByIndex(value: any, index: any, filter: any = null): any {
        this.Query = this.Query.getAll(value, { index: index }).limit(1);
        return this;
    }

    orderBy({ order = 'asc', prop = '' }) {
        if (order==='asc') {
            this.Query = this.Query.orderBy({ index: this.r.asc(prop) });
        } else {
            this.Query = this.Query.orderBy({ index: this.r.desc(prop) });
        }
        return this;
    }

    // You can either use the repository.join directly or use this one
    // The only advantage of using this one is that it passes its own table for you
    // So it takes 1 less argument. It's whatever
    // It registers a relation in the repository. Read in repository why I made it a seperate module
    join(right: string, leftKey: string, rightKey: string, type: number, model: any = null, cacheResults: boolean = false, identifier: string = '') : any {
        repository.join(this.Table, right, leftKey, rightKey, type, model, cacheResults, identifier);
    }

    // Saves the model, returns a promise that resolves with the (new) value of the prim. key
    save() : Promise<any> {
        return new Promise(async (resolve, reject) => {
            let modelData = this.json({ includeRelations: false });
            if (!modelData[this.PrimaryKey]) {
                delete modelData[this.PrimaryKey];
            }
            let data = await db.r.table(this.Table).insert(modelData, { conflict: 'update', returnChanges: true });
            if (data.generated_keys && data.generated_keys.length > 0) {
                if (!this.DBProperties.includes(this.PrimaryKey)) {
                    this.DBProperties.push(this.PrimaryKey);
                }
                this[this.PrimaryKey] = data.generated_keys[0];
            }
            const newData = await this.resolveRelations([this.json({ includeRelations: false })]);

            resolve(new this.child(newData[0]));
        })
    }

    // Deletes the entry this model refers to from the database
    delete() {
        this.Query = this.Query.delete();
        return this;
    }

    cache() {
        repository.cache(this[this.PrimaryKey], this);
    }

    async resolveRelations(data: any) {
        return new Promise(async (resolve, reject) => {
            const relations = repository.getRelations(this.Table);

            if (Object.keys(relations).length === 0 || !data) {
                return resolve(data);
            }
            await Aigle.map(relations, async relation => {
                await Aigle.map(data, async entry => {
                    // In case you want to know/read what it's doing here
                    // Aigle is async, so you can await and the rest outside of the loop will wait
                    // I check the relation. If it's x to one, it's way faster to do a get instead of a filter
                    // After this, it will check if there was a constructor (model) passed when .join was called
                    // If there was, it will return instances of that model given the data it loaded from the db
                    // Very dope
                    if (entry!==null && entry[relation.left]) {
                        if (relation.type === RelationTypes.ManyToOne || relation.type === RelationTypes.OneToOne) {
                            if (relation.cacheResults && repository.Memory.hasOwnProperty(entry[relation.left])) {
                                entry[relation.table] = relation.model ? new relation.model(repository.Memory[entry[relation.left]]) : repository.Memory[`${this.Table}_${entry[relation.left]}`];
                            } else {
                                let subdata = await db.r.table(relation.table).get(entry[relation.left]);
                                entry[relation.identifier] = relation.model ? new relation.model(subdata) : subdata;
                                if (relation.cacheResults) {
                                    repository.cache(`${this.Table}_${entry[relation.left]}`, subdata);
                                }
                            }
                        } else {
                            let subdata = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(entry[relation.left]));
                            entry[relation.identifier] = relation.model ? subdata.map(d => {
                                return new relation.model(d)
                            }) : subdata;
                        }
                    }
                })
            });
            resolve(data);
        });
    }
}