/* test/index.ts - An example of how we would utilize this framework

*/

import {framework} from "../index";
import {RelationTypes} from "../database/repository";

import {User} from "./models/user";
import {Bet} from "./models/bet";

framework.bootstrap({
    db: 'framework'
}).then(async done => {
    console.log(`Bootstrap complete`);
    // Now we can mount the routes etc. since the base framework is initialised
    console.log(`List`, await framework.DB.tableList());

/*    let user = new User({
        name: 'Tim',
        password: 'someHash',
        balance: 0
    });

    console.log(await user.save(), user.json());*/

    let bet = new Bet();
    bet.join('user', 'user_id', 'id', RelationTypes.ManyToOne);

    let bets = await bet.all();

    bets.forEach(b => {
        console.log(b.json());
    });

    let b = await new Bet().get('a7555e6b-3160-4c20-989b-a2806bdeaf84');

    b.amount = Math.random() * 100;

    console.log(`Bet`, b.json());

    await b.save();

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