import Model from "../../database/model";

interface user {
    id?: string,
    user_id: string,
    amount: number,
    date: Date
}

export class Bet extends Model {
    public Table : string = 'bet';
    public PrimaryKey : string = 'id';

    public Properties : user = {
        id: '',
        user_id: '',
        amount: 0,
        date: new Date()
    };

    public id : string;
    public user_id : string;
    public amount : number;
    public date : Date;

    constructor(data:user = null) {
        super(data);
    }
}