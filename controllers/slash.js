const MessageHandler = require('../modules/messageHandler');
const Order = require('../databaseObjects/Order');

module.exports = function (app, config, client) {
    var dbo = new Order(client);
    var msgHandler = new MessageHandler(dbo);

    app.post('/order/v1/slash', function(req, res) {
        if (!req.body.token || req.body.token !== config.slashToken) {
            res.status(403).send();
            return;
        }
        msgHandler.routeMessage(req.body)
        .then(msg => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(msg));
        });
    });

    app.get('/order/v1/order', function(req, res) {
        if (!req.body.channel_id) {
            res.status(400).send();
            return;
        }
        dbo.listOrdersWithSuffix(':' + req.body.channel_id)
        .then(list => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(list));
        })
        .catch(() => res.status(500));
    });
};
