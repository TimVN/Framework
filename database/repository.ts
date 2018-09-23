/* repository.ts - Keeps track of relations
Very simple, relations are stored here
Why though? Cause it doesn't forget. Set the join in 1 place, and all other places that load
this module will have access to those same relations
*/
const Relations = {};

interface relation {
    table: string,
    left: string,
    right: string,
    type: number
}

export class Repository {
    // This stores the relation obviously
    // I give it a key that is basically just the arguments as a concatenated string
    // Cause you could possibly have more than 1 relation, I figured why not
    join(left: string, right: string, leftKey: string, rightKey: string, type: number, model: any) : void {
        Relations[left] = Relations[left] || {};
        Relations[left][`${left}${right}${leftKey}${rightKey}`] = {
            table: right,
            left: leftKey,
            right: rightKey,
            type: type,
            model: model
        };
    }

    // No idea when this will be used, but why not
    unjoin(left: string, right: string, leftKey: string, rightKey: string, type: number) : void {
        if (!Relations.hasOwnProperty(left)) return;
        delete Relations[left][`${left}${right}${leftKey}${rightKey}`];
    }

    getRelations(left: string): relation {
        return Relations[left] || {};
    }

    get relations() {
        return Relations;
    }
}

// These can be imported and used
// Makes shit more readable
export const RelationTypes = {
    OneToOne: 1,
    OneToMany: 2,
    ManyToOne: 3,
    ManyToMany: 4
};
