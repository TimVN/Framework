/* user.ts - An example user model
You don't actually need that interface if you don't want to
It is important that every property of user is set and public
It uses its "Properties" variable for other purposes, and is therefor not optional
*/
import Model from "../../database/model";

interface user {
    id?: string,
    name: string,
    password: string,
    balance: number,
    country_id: string
}

export class User extends Model {
    public Table : string = 'user';
    public PrimaryKey : string = 'id';

    public Properties : user = {
        id: '',
        name: '',
        password: '',
        balance: 0,
        country_id: ''
    };

    public id : string;
    public name : string;
    public password : string;
    public balance : number;

    constructor(data:user = null) {
        super(data);
    }
}