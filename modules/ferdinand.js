var request = require('request')
,   cheerio = require('cheerio')
,   Promise = require('promise')


function Ferdinand() {
    this.url = 'http://ferdinandsorhaz.hu/',

    this.update = function(data) {
        var promise = new Promise(function(resolve, reject) {
    		request(this.url, function(err, response, body) {
    			if (err) {
    				console.error(err);
    				reject(data);
    			}
    			$ = cheerio.load(body);
    			var lastUpdate = $('#sidebar>div>div>div>span>div>span').text();
                var menu = $('#sidebar>div>div>div>div:nth-child(4)').text();

                menu = menu.split('\n').map(x => x.trim()).filter(x => x.length > 0);
                menu[0] = 'A Ferdinánd ' + menu[0].toLowerCase() + 'i ajánlata:'
                menu = menu.join('\n');

                if (!data.store.ferdinand) {
                    data.store.ferdinand = {lastUpdate: ''};
                }

                if (!data.store.ferdinand.lastUpdate || data.store.ferdinand.lastUpdate !== lastUpdate) {
                    data.store.ferdinand.lastUpdate = lastUpdate;
                    data.message.attachments.push({
                        text: menu
                    });
                }
    			resolve(data);
    		});
    	}.bind(this));
    	return promise;
    }.bind(this);
    return {updateFerdinand: this.updateFerdinand};
};

module.exports = Ferdinand;
