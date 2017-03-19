function start(res, client, msgWords) {
    if (!msgWords[2]) {
        console.error('No sessionId.');
        res.status(400).send();
    }
    const sessionId = msgWords[2];

}

module.exports = function (app, client) {
    app.post('/order/v1/slash', function(req, res) {
        console.log(req);
        res.status(200).send();
    });
};
