const Promise = require('bluebird');
const MessageActions = require('./messageActions');

function routeMessage(dbo, payload) {
    var promise = new Promise(function(resolve, reject) {
        const words = payload.text.replace(/[\s\t]+/g,' ').split(' ');
        const msgActions = new MessageActions(dbo, payload, words);
        if (words.length < 1) {
            resolve(msgActions.invalidCmd());
            return;
        }
        switch (words[0].toLowerCase()) {
            case 'get':
                msgActions.getOrder()
                .then(resolve)
                .catch(resolve);
                break;
            case 'start':
            case 'create':
                msgActions.startOrder()
                .then(resolve)
                .catch(resolve);
                break;
            case 'kill':
            case 'stop':
            case 'close':
                msgActions.stopOrder()
                .then(resolve)
                .catch(resolve);
                break;
            case 'join':
            case 'set':
            case 'update':
                msgActions.addItem()
                .then(resolve)
                .catch(resolve);
                break;
            case 'cancel':
            case 'rm':
                msgActions.removeItem()
                .then(resolve)
                .catch(resolve);
                break;
            case 'h':
            case 'help':
            case 'halp':
            case 'man':
                resolve(msgActions.help());
            default:
                resolve(msgActions.invalidCmd());
        }
    });
    return promise;
}

module.exports = function(dbo) {
    return {
        routeMessage: routeMessage.bind({}, dbo)
    }
};
