import { Framework } from "../index";
import { User } from "./models/user";
import { Country } from "./models/country";

// Bootstrap needs to run before doing anything related to the ORM
// This ensures that there is a connection to the database
Framework.bootstrap().then(async () => {
    console.log(`Ready`);

    // Saving returns an instance of itself
/*    const country = await new Country({
        name: 'Netherlands',
    }).save();*/

/*    console.log(`Country\n`, country.json());

    const user = await new User({
        name: 'Tim',
        password: 'encryptedPassword',
        country_id: country.id,
    }).save();*/

    //const users = await new User().all().run();

    //console.log(users.map(u => { return u.json() }));

    //const user = await new User().get('379c9ca3-24f4-4f57-b003-e43d94657cfd').run();
    const user = await new User().filter({ name: 'Jaap de Jager' }).run();

    console.log(user.json());

    // console.log(`User\n`, user.json());
    // User object will contain another property "country" that contains an instance of the Country modek
    // Cause the User model creates a relation in its constructor
}).catch(e => {
    console.error(`Could not bootstrap framework`, e)
});