var request = require('request')
,   cheerio = require('cheerio')
,   Promise = require('bluebird')


function Nokedli() {
    this.imgBaseUrl = 'http://nokedlikifozde.hu/wp-content/uploads/',
    this.url = 'http://nokedlikifozde.hu/wp-content/uploads/?C=M;O=D;F=1',

    this.update = function(data) {
        var promise = new Promise(function(resolve, reject) {
    		request(this.url, function(err, response, body) {
    			if (err) {
    				console.error(err);
    				reject(data);
    			}
    			$ = cheerio.load(body);
    			var imgName = $('a')[5].attribs.href;

                if (!data.store.nokedli) {
                    data.store.nokedli = {lastImg: ''};
                }

                if (!data.store.nokedli.lastImg || data.store.nokedli.lastImg !== imgName) {
                    data.store.nokedli.lastImg = imgName;
                    data.message.attachments.push({
                        text: 'A Nokedli új képet rakott ki! :wink:',
            			image_url: (this.imgBaseUrl + imgName)
                    });
                }
    			resolve(data);
    		}.bind(this));
    	}.bind(this));
    	return promise;
    }.bind(this);
    return {update: this.update};
};

module.exports = Nokedli;
