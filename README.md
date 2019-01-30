# Framework
RethinkDB ORM.

To run a test, make sure to create a 'user' and 'country' table in either your own rethink db, or in the 'test' DB. If not using the test DB, specify 'db' in the DB options that are passed in the bootstrap function of the framework.

All base functionality is written in database/model. Switch to the chainable branch for a more complete set of functionality. The only difference between the master and chainable is that the operations in the chainable branch are... chainable.

To run the test, edit test/index.ts (or don't) and run:

    tsc
    
    npm run test
    or
    node dist/test
