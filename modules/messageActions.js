const Promise = require('bluebird');
const MessageSkeleton = require('./messageSkeleton')

function mkOrderId(id, chId) {
    return (id + ':' + chId);
}

function invalidCmd(msg) {
    msg.text = ':warning: Invalid command. :warning:\n \
    Take a look at our help. :arrow_right:  `/food4me help`';
    return msg;
}

function help(msg) {
    msg.text = 'Start new order: `/food4me (start|create) {orderName}`\n \
Get info about existing order: `/food4me get {orderName}`\n \
List existing orders: `/food4me get {orderName}`\n \
Close ongoing order: `/food4me (stop|kill|close) {orderName}`\n \
Join order: `/food4me (join|set) {orderName} {your text}`\n \
Update your order item: `/food4me (update|set) {orderName} {your text}`\n \
Remove your order item: `/food4me (rm|cancel) {orderName}`\n \
Print this help: `/food4me (h|help|halp|man) {orderName}`';
    return msg;
}

function internalError(payload, msg) {
    msg.icon_emoji = ':frowning:';
    msg.text = 'Pssssst... ' + payload.user_name +
        '... There was a little accident... Dunno what happened exactly, \
but I can\'t do what you have requested right now... :confused: I\'m pretty \
sure those evil developers are in charge for this... :unamused:';
    return msg;
}

function getOrder(dbo, payload, words, msg) {
    var promise = new Promise(function(resolve, reject) {
        if (words.length < 2) {
            resolve(invalidCmd(msg));
            return;
        }
        const orderId = mkOrderId(words[1], payload.channel_id);
        dbo.getOrder(orderId)
        .then(obj => {
            if (obj) {
                msg.text = Object.keys(obj).reduce((prev, curr) => {
                    return prev + '\n*' + curr + '*:\n' + obj[curr];
                }, 'Items in *' + words[1] + '*:')
            } else {
                msg.text = ('Order *'+ words[1] +'* is empty os does not exists.');
            }
            resolve(msg);
        }).catch(() => resolve(internalError(payload, msg)));
    });
    return promise;
}

function list(dbo, payload, msg) {
    var promise = new Promise(function(resolve, reject) {
        const suffix = ':' + payload.channel_id;
        dbo.listOrdersWithSuffix(suffix)
        .then(list => {
            msg.text = list.reduce((prev, elem) => {
                const ord = elem.orderId.split(':')[1];
                const openStr = (elem.isOpen) ? 'open' : 'closed';
                return (prev + '\n' + ord + ': ' + openStr);
            }, 'Orders:');
            resolve(msg);
        })
        .catch(() => resolve(internalError(payload, msg)));
    });
    return promise;
}

function startOrder(dbo, payload, words, msg) {
    var promise = new Promise(function(resolve, reject) {
        if (words.length < 2) {
            resolve(invalidCmd(msg));
            return;
        }
        const orderId = mkOrderId(words[1], payload.channel_id);
        dbo.createOrder(orderId)
        .then(() => {
            msg.response_type = 'in_channel';
            msg.text = 'Order session *' + words[1] + '* has been started.';
            resolve(msg);
        }).catch(err => {
            if (err === 'ALREADY_SET') {
                msg.text = 'Order *' + words[1] + '* has been already started.';
                resolve(msg);
            } else {
                resolve(internalError(payload, msg));
            }
        });
    });
    return promise;
}

function stopOrder(dbo, payload, words, msg) {
    var promise = new Promise(function(resolve, reject) {
        if (words.length < 2) {
            reject(invalidCmd(msg));
            return;
        }
        const orderId = mkOrderId(words[1], payload.channel_id)
        dbo.closeOrder(orderId)
        .then(() => {
            msg.response_type = 'in_channel';
            msg.text = 'Order *' + words[1] + '* has been closed.';
            resolve(msg);
        })
        .catch(err => {
            if (err === 'CLOSED_OR_NULL') {
                msg.text = 'Order *' + words[1] + '* has been already closed or not exists.';
                resolve(msg);
            } else {
                resolve(internalError(payload, msg));
            }
        });
    });
    return promise;
}

function addItem(dbo, payload, words, msg) {
    var promise = new Promise(function(resolve, reject) {
        if (words.length < 3) {
            resolve(invalidCmd(msg));
            return;
        }
        const orderId = mkOrderId(words[1], payload.channel_id)
        dbo.addItemToOrder(orderId, payload.user_name, words.slice(2).join(' '))
        .then(() => {
            msg.text = 'Your order has been recorded. :wink:';
            resolve(msg);
        })
        .catch(err => {
            if (err === 'CLOSED_OR_NULL') {
                msg.text = 'Order *' + words[1] + '* has been already closed or not exists.';
                resolve(msg);
            } else {
                resolve(internalError(payload, msg));
            }
        });
    });
    return promise;
}

function removeItem(dbo, payload, words, msg) {
    var promise = new Promise(function(resolve, reject) {
        if (words.length < 2) {
            reject(invalidCmd(msg));
            return;
        }
        const orderId = mkOrderId(words[1], payload.channel_id)
        dbo.removeItemFromOrder(orderId, payload.user_name)
        .then(() => {
            msg.text = 'Your item has been removed from order *' + words[1] + '*.';
            resolve(msg);
        }).catch(err => {
            if (err === 'CLOSED_OR_NULL') {
                msg.text = 'Order *' + words[1] + '* has been already closed or not exists.';
                resolve(msg);
            } else if (err === 'INVALID_ITEM') {
                msg.text = 'You haven\'t got any items in order *' + words[1] + '*.';
                resolve(msg);
            } else {
                resolve(internalError(payload, msg));
            }
        });
    });
    return promise;
}

module.exports = function(dbo, payload, words) {
    var msgSkeleton = new MessageSkeleton();
    return {
        getOrder: getOrder.bind({}, dbo, payload, words, msgSkeleton),
        list: list.bind({}, dbo, payload, msgSkeleton),
        startOrder: startOrder.bind({}, dbo, payload, words, msgSkeleton),
        stopOrder: stopOrder.bind({}, dbo, payload, words, msgSkeleton),
        addItem: addItem.bind({}, dbo, payload, words, msgSkeleton),
        removeItem: removeItem.bind({}, dbo, payload, words, msgSkeleton),
        invalidCmd: invalidCmd.bind({}, msgSkeleton),
        help: help.bind({}, msgSkeleton)
    }
};
