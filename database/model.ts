/* model.ts - The base model for every model that contains the underlying logic
I have decided to not be a faggot and comment what I'm doing here
So you'll be able to understand faster/more easily
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

    private child;
    public data;

    constructor(data: any) {
        this.DBProperties = [];
        this.child = this.constructor;

        // Instead of using that decorator we pulled our hair out on
        // The basemodel just sets the properties when it gets fed with them
        if (data!==null) {
            Object.keys(data).forEach(property => {
                if (this.hasOwnProperty(property)) {
                    throw new Error(`Property ${property} already exists`);
                }
                this[property] = data[property];
            });

            this.DBProperties = Object.keys(data);
        }
    }

    // This does what you think it does, there is one big difference though
    // By default, it will return any relations it may have and their values
    // The reason it can be disabled, is because the save() function calles .json() as well
    // And because you don't want to store joined data in one table, you can opt out so it won't return them
    json(includeRelations = true, exclude: any = []) {
        let _tmp = {};

        Object.keys(this.Properties).forEach(p => {
            if (!exclude.includes(p)) {
                _tmp[p] = this[p] ? this[p] : this.Properties[p];
            }
        });

        if (includeRelations) {
            let relations = repository.getRelations(this.Table);

            // I will explain why I use Aigle more down
            // This returns the data that was loaded through relations. If a constructor (model) was passed to the join function
            // The data that is in the relations are instances of that model. We check if that is the case
            // If yes, we can run .json() on the nested model. Recursion handles the rest
            Aigle.map(relations, relation => {
                if (this[relation.table]) {
                    _tmp[relation.table] = typeof this[relation.table].json === "function" ? this[relation.table].json() : this[relation.table];
                }
            });
        }

        return _tmp;
    }

    // This simply gets all the entries in the table
    // Also (tries) to load relations
    // Skipping relations is optional, for when you don't really need the related data
    all(includeRelations: boolean = true) : any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table);

            let relations = repository.getRelations(this.Table);

            if (Object.keys(relations).length > 0 && includeRelations && data) {
                await Aigle.map(relations, async relation => {
                    await Aigle.map(data, async entry => {
                        // In case you want to know/read what it's doing here
                        // Aigle is async, so you can await and the rest ouside of the loop will wait
                        // I check the relation. If it's x to one, it's way faster to do a get instead of a filter
                        // After this, it will check if there was a constructor (model) passed when .join was called
                        // If there was, it will return instances of that model given the data it loaded from the db
                        // Very dope
                        if (entry[relation.left]) {
                            if (relation.type === RelationTypes.ManyToOne || relation.type === RelationTypes.OneToOne) {
                                let subdata = await db.r.table(relation.table).get(entry[relation.left]);
                                entry[relation.table] = relation.model ? new relation.model(subdata) : subdata;
                            } else {
                                let subdata = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(entry[relation.left]));
                                entry[relation.table] = relation.model ? subdata.map(d => {
                                    return new relation.model(d)
                                }) : subdata;
                            }
                        }
                    })
                })
            }

            resolve(data.map(values => {
                return new this.child(values);
            }));
        });
    }

    // Same as .all() except for 1 entry
    get(id: string, includeRelations: boolean = true) : any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).get(id);

            let relations = repository.getRelations(this.Table);

            if (Object.keys(relations).length > 0 && includeRelations && data) {
                await Aigle.map(relations, async relation => {
                    // Check all() to read about the logic that's happening here
                    if (data[relation.left]) {
                        if (relation.type === RelationTypes.ManyToOne || relation.type === RelationTypes.OneToOne && data[relation.left]) {
                            data[relation.table] = await new relation.model().get(data[relation.left]);
                            //let subdata = await db.r.table(relation.table).get(data[relation.left]);
                            //data[relation.table] = relation.model && subdata ? new relation.model(subdata) : subdata;
                        } else {
                            let subdata = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(data[relation.left]));
                            data[relation.table] = relation.model ? subdata.map(d => {
                                return new relation.model(d)
                            }) : subdata;
                        }
                    }
                })
            }

            resolve(data ? new this.child(data) : new this.child());
        });
    }

    find(index: number = 1, includeRelations = true) : any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).limit(index);

            let relations = repository.getRelations(this.Table);

            if (Object.keys(relations).length > 0 && includeRelations && data.length > 0) {
                data = data[0];
                await Aigle.map(relations, async relation => {
                    // Check all() to read about the logic that's happening here
                    if (data[relation.left]) {
                        if (relation.type === RelationTypes.ManyToOne || relation.type === RelationTypes.OneToOne && data[relation.left]) {
                            data[relation.table] = await new relation.model().get(data[relation.left]);
                            //let subdata = await db.r.table(relation.table).get(data[relation.left]);
                            //data[relation.table] = relation.model && subdata ? new relation.model(subdata) : subdata;
                        } else {
                            let subdata = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(data[relation.left]));
                            data[relation.table] = relation.model ? subdata.map(d => {
                                return new relation.model(d)
                            }) : subdata;
                        }
                    }
                })
            }

            resolve(data ? new this.child(data) : new this.child());
        });
    }

    findByIndex(value: any, index: any): any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).getAll(value, {index: index});

            let relations = repository.getRelations(this.Table);

            if (Object.keys(relations).length > 0 && data) {
                await Aigle.map(relations, async relation => {
                    await Aigle.map(data, async entry => {
                        // In case you want to know/read what it's doing here
                        // Aigle is async, so you can await and the rest ouside of the loop will wait
                        // I check the relation. If it's x to one, it's way faster to do a get instead of a filter
                        // After this, it will check if there was a constructor (model) passed when .join was called
                        // If there was, it will return instances of that model given the data it loaded from the db
                        // Very dope
                        if (entry[relation.left]) {
                            if (relation.type === RelationTypes.ManyToOne || relation.type === RelationTypes.OneToOne) {
                                if (relation.cacheResults && repository.Memory.hasOwnProperty(entry[relation.left])) {
                                    entry[relation.table] = relation.model ? new relation.model(repository.Memory[entry[relation.left]]) : repository.Memory[entry[relation.left]];
                                } else {
                                    let subdata = await db.r.table(relation.table).get(entry[relation.left]);
                                    entry[relation.table] = relation.model ? new relation.model(subdata) : subdata;
                                    if (relation.cacheResults) {
                                        repository.cache(entry[relation.left], subdata);
                                    }
                                }
                            } else {
                                let subdata = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(entry[relation.left]));
                                entry[relation.table] = relation.model ? subdata.map(d => {
                                    return new relation.model(d)
                                }) : subdata;
                            }
                        }
                    })
                })
            }

            resolve(data.map(e => { return new this.child(e) }));
        });
    }

    findOneByIndex(value: any, index: any): any {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).getAll(value, {index: index}).limit(1);
            resolve(data.length > 0 ? new this.child(data[0]) : false);
        });
    }

    // You can either use the repository.join directly or use this one
    // The only advantage of using this one is that it passes its own table for you
    // So it takes 1 less argument. It's whatever
    // It registers a relation in the repository. Read in repository why I made it a seperate module
    join(right: string, leftKey: string, rightKey: string, type: number, model: any = null) : any {
        repository.join(this.Table, right, leftKey, rightKey, type, model);
    }

    // Saves the model, returns a promise that resolves with the (new) value of the prim. key
    save() {
        return new Promise(async (resolve, reject) => {
            let modelData = this.json(false);
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

            resolve(this[this.PrimaryKey]);
        })
    }

    // Deletes the entry this model refers to from the database
    delete() {
        return new Promise(async (resolve, reject) => {
            let data = await db.r.table(this.Table).get(this[this.PrimaryKey]).delete();

            resolve(data.deleted);
        })
    }
}