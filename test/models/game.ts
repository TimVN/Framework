import Model from "../../database/model";

interface game {
    id?: string,
    name: string
}

export class Game extends Model {
    public Table : string = 'game';
    public PrimaryKey : string = 'id';

    public Properties : game = {
        id: '',
        name: ''
    };

    public id : string;
    public name : string;

    constructor(data:game = null) {
        super(data);
    }
}