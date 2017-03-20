const Promise = require('bluebird');
const EXPIRE = 43200 // 12 hours

function mkOrdId(id) {return ('order:' + id);}
function mkObjId(id) {return ('order:' + id + ':data');}

function getOrder(client, id) {
    const ordId = mkOrdId(id);
    const objId = mkObjId(id);
    return client.getAsync(ordId)
    .then(() => client.hgetallAsync(objId));
}

function createOrder(client, id) {
    const ordId = mkOrdId(id);
    var promise = new Promise(function(resolve, reject) {
        client.getAsync(ordId)
        .then(function(isOpen) {
            if (isOpen) {
                reject('ALREADY_SET');
                return;
            }
            client.setAsync(ordId, 1)
            .then(() => client.expireAsync(ordId, EXPIRE))
            .then(() => resolve({}));
        });
    });
    return promise;
}

function addItemToOrder(client, id, user, item) {
    const ordId = mkOrdId(id);
    const objId = mkObjId(id);
    var promise = new Promise(function(resolve, reject) {
        client.getAsync(ordId)
        .then(function(isOpen) {
            if (!isOpen || isOpen != 1) {
                reject('CLOSED_OR_NULL');
                return;
            }
            client.hsetAsync(objId, user, item)
            .then(() => client.expireAsync(ordId, EXPIRE))
            .then(() => client.expireAsync(objId, EXPIRE))
            .then(() => resolve());
        });
    });
    return promise;
}

function listOrdersWithSuffix(client, suffix) {
    const pattern = 'order:*' + suffix;
    var promise = new Promise(function(resolve, reject) {
        client.keysAsync(pattern)
        .then(list => {
            return {
                orders: list,
                vals: list.map(ord => client.getAsync(ord))
            };
        })
        .then(obj => {
            Promise.all(obj.vals)
            .then(valList => {
                var toZip = {
                    orders: obj.orders,
                    vals: valList.map(x => parseInt(x) === 1)
                };
                var res = toZip.orders.map((elem, ind) => {
                    return {orderId: elem, isOpen: toZip.vals[ind]};
                })
                resolve(res);
            });
        })
        .catch(reject);
    });
    return promise;
}

function removeItemFromOrder(client, id, user, item) {
    const ordId = mkOrdId(id);
    const objId = mkObjId(id);
    var promise = new Promise(function(resolve, reject) {
        client.getAsync(ordId)
        .then(function(isOpen) {
            if (!isOpen || isOpen != 1) {
                reject('CLOSED_OR_NULL');
                return;
            }
            client.hdelAsync(objId, user)
            .then((result) => {
                if (result == 1) {
                    resolve();
                } else {
                    reject('INVALID_ITEM');
                }
            });
        });
    });
    return promise;
}

function closeOrder(client, id) {
    const ordId = mkOrdId(id);
    var promise = new Promise(function(resolve, reject) {
        client.getAsync(ordId)
        .then(function(isOpen) {
            if (!isOpen || isOpen != 1) {
                reject('CLOSED_OR_NULL');
                return;
            }
            client.setAsync(ordId, 0)
            .then(() => resolve())
            .catch(reject);
        });
    });
    return promise;
}

function isOpen(client, id) {
    const ordId = mkOrdId(id);
    var promise = new Promise(function(resolve, reject) {
        client.getAsync(ordId)
        .then(function(isOpen) {
            if (!isOpen) {
                reject('NULL');
                return;
            }
            client.setAsync(ordId, 0)
            .then(() => resolve(parseInt(isOpen) === 1));
        });
    });
    return promise;
}

module.exports = function(client) {
    return {
        createOrder: createOrder.bind({}, client),
        closeOrder: closeOrder.bind({}, client),
        getOrder: getOrder.bind({}, client),
        isOpen: isOpen.bind({}, client),
        addItemToOrder: addItemToOrder.bind({}, client),
        removeItemFromOrder: removeItemFromOrder.bind({}, client),
        listOrdersWithSuffix: listOrdersWithSuffix.bind({}, client)
    }
};
