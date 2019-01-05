import * as Datastore from 'nedb';

export default (filename: string) => {
    const db = new Datastore({ filename: `${filename}.db`, autoload: true });

    const find = (filter: object) =>
        new Promise((resolve: (...args) => any, reject: (...args) => any) => {
            db.findOne(filter, (error, obj) =>
                error ? reject(null) : resolve(obj)
            );
        });

    const findAll = (filter: object) =>
        new Promise((resolve: (...args) => any, reject: (...args) => any) => {
            db.find(filter, (error, obj) =>
                error ? reject(null) : resolve(obj)
            );
        });

    const insert = (toInsert: object) =>
        new Promise((resolve: (...args) => any, reject: (...args) => any) => {
            db.insert(toInsert, (error, obj) =>
                error ? reject(error) : resolve(obj)
            );
        });

    const update = (filter: object, update: object, options: object = {}) =>
        new Promise((resolve: (...args) => any, reject: (...args) => any) => {
            db.update(filter, update, options, (error, obj) =>
                error ? reject(error) : resolve(obj)
            );
        });

    const remove = (filter: object) =>
        new Promise((resolve: (...args) => any, reject: (...args) => any) => {
            db.remove(filter, error => (error ? reject(error) : resolve()));
        });

    return {
        find,
        findAll,
        insert,
        remove,
        update,
    };
};
