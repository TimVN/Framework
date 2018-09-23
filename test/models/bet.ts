import Model from "../../database/model";

interface bet {
    id?: string,
    user_id: string,
    game_id: string,
    amount: number,
    date: Date,
    game: any
}

export class Bet extends Model {
    public Table : string = 'bet';
    public PrimaryKey : string = 'id';

    public Properties : bet = {
        id: '',
        user_id: '',
        game_id: '',
        amount: 0,
        date: new Date(),
        game: null
    };

    public id : string;
    public user_id : string;
    public game_id : string;
    public amount : number;
    public date : Date;
    public game: any;

    constructor(data:bet = null) {
        super(data);
    }
}