import Model from "../../database/model";

interface country {
    id?: string,
    name: string
}

export class Country extends Model {
    public Table : string = 'country';
    public PrimaryKey : string = 'id';

    public Properties : country = {
        id: '',
        name: ''
    };

    public id : string;
    public name : string;

    constructor(data:country = null) {
        super(data);
    }
}