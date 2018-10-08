import Model from "../../database/model";
import { RelationTypes } from "../../database/repository";
import { Country } from "./country";

interface user {
    id?: string,
    name: string,
    password: string,
    country_id: string,
}

export class User extends Model {
    public Table : string = 'user';
    public PrimaryKey : string = 'id';

    public Properties : user = {
        id: '',
        name: '',
        password: '',
        country_id: '',
    };

    public id: string;
    public name: string;
    public password: string;

    constructor(data:user = null) {
        super(data);

        this.join('country', 'country_id', 'id', RelationTypes.ManyToOne, Country,true);
    }
}