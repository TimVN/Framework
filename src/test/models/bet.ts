import Model from "../../database/model";

interface bet {
    id?: string,
    user_id: string,
    game_id: string,
    amount: number,
    date: Date
}

export class Bet extends Model {
    public Table : string = 'bet';
    public PrimaryKey : string = 'id';

    public Properties : bet = {
        id: '',
        user_id: '',
        game_id: '',
        amount: 0,
        date: new Date()
    };

    public id : string;
    public user_id : string;
    public game_id : string;
    public amount : number;
    public date : Date;

    constructor(data:bet = null) {
        super(data);
    }
}