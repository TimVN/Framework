/* test/index.ts - An example of how we would utilize this framework

*/

import {Framework} from "../index";
import {RelationTypes} from "../database/repository";
import {Repository} from "../database/repository";

import {User} from "./models/user";
import {Bet} from "./models/bet";
import {Game} from "./models/game";
import {Country} from "./models/country";

const repository = new Repository();

Framework.bootstrap({
    db: 'framework'
}).then(async () => {
    console.log(`Bootstrap complete`);
    // Now we can mount the routes etc. since the base framework is initialised
    console.log(`List`, await Framework.DB.tableList());

/*    let user = new User({
        name: 'Tim',
        password: 'someHash',
        balance: 0
    });

    console.log(await user.save(), user.json());*/

    repository.join('user', 'country', 'country_id', 'id', RelationTypes.ManyToOne, Country);

    let bet = new Bet();
    bet.join('user', 'user_id', 'id', RelationTypes.ManyToOne, User);
    bet.join('game', 'game_id', 'id', RelationTypes.ManyToOne, Game);

    let bets = await bet.all();

    bets.forEach(async b => {
        //let u = new User(b.json().user);
        //u.name = 'Something';
        //await u.save();
        //console.log(b.json());
    });

    let b = await new Bet().get('3504cd9e-2bbd-4f34-be91-709ef668b984');

    console.log(b.json());

    //console.log(b.json());

    //await b.save();

/*    await new User({
        name: 'Tim',
        password: 'Wahet',
        balance: 100
    }).save();*/

    //await newUser.save();

    //console.log(`New user`, newUser.json());
/*    console.log(`User`, user.json());

    console.log(`Saving`, await user.save());

    console.log(`User`, user.json());*/

    let loadUser = await new User().get('61eca28e-7445-4390-be81-b44012a58852');

    //console.log(`Loaded model with .get()`, loadUser.json());

    //let users = await new User().all();

/*    users.forEach(async user => {
        user.name = 'Darnel';
        user.balance = Math.random() * 100;
        user.skipMe = 'Not saved';
        //await user.save();
        //console.log(`User after saving`, user.json());
    })*/
});