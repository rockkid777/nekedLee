var request = require('request')
,   cheerio = require('cheerio')
,   Promise = require('promise')


function Nokedli() {
    imgBaseUrl = 'http://nokedlikifozde.hu/wp-content/uploads/',
    url = 'http://nokedlikifozde.hu/wp-content/uploads/?C=M;O=D;F=1',

    this.updateNokedli = function(data) {
        var promise = new Promise(function(resolve, reject) {
    		request(url, function(err, response, body) {
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
            			image_url: (imgBaseUrl + imgName)
                    });
                }
    			resolve(data);
    		});
    	});
    	return promise;
    };
    return {updateNokedli: this.updateNokedli};
};

module.exports = new Nokedli();
