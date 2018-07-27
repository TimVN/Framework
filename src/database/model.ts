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
const Models = {};

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
    json(includeRelations = true) {
        let _tmp = {};

        Object.keys(this.Properties).forEach(p => { _tmp[p] = this[p] ? this[p] : this.Properties[p] });

        if (includeRelations) {
            let relations = repository.getRelations(this.Table);

            // I will explain why I use Aigle more down
            Aigle.map(relations, relation => {
                _tmp[relation.table] = this[relation.table];
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

            if (Object.keys(relations).length > 0 && includeRelations) {
                await Aigle.map(relations, async relation => {
                    await Aigle.map(data, async entry => {
                        if (relation.type===RelationTypes.ManyToOne || relation.type===RelationTypes.OneToOne) {
                            entry[relation.table] = await db.r.table(relation.table).get(entry[relation.left]);
                        } else {
                            entry[relation.table] = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(entry[relation.left]));
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

            if (Object.keys(relations).length > 0 && includeRelations) {
                await Aigle.map(relations, async relation => {
                    if (relation.type===RelationTypes.ManyToOne || relation.type===RelationTypes.OneToOne) {
                        data[relation.table] = await db.r.table(relation.table).get(data[relation.left]);
                    } else {
                        data[relation.table] = await db.r.table(relation.table).filter(db.r.row(relation.right).eq(data[relation.left]));
                    }
                })
            }

            resolve(data ? new this.child(data) : new this.child());
        });
    }

    // You can either use the repository.join directly or use this one
    // The only advantage of using this one is that it passes its own table for you
    // So it takes 1 less argument. It's whatever
    // It registeres a relation in the repository. Read in repository why I made it a seperate module
    join(right: string, leftKey: string, rightKey: string, type: number) : any {
        repository.join(this.Table, right, leftKey, rightKey, type);
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
}