var request = require('request')
,   Promise = require('promise')
,   fs      = require('fs')
,   Slack   = require('slack-node')
,   cheerio = require('cheerio')
,   config  = require('./var/config.js')
,	nokedli = require('./modules/nokedli.js');

var data = {
	imgBaseUrl: 'http://nokedlikifozde.hu/wp-content/uploads/',
	url: 'http://nokedlikifozde.hu/wp-content/uploads/?C=M;O=D;F=1',
	message: {
		username: 'Neked Lee',
		icon_emoji: ':ramen:',
	    attachments: []
	},
	webhookUri: config.webhookUri,
	store: {}
};

var readFs = Promise.denodeify(fs.readFile);
var writeFs = Promise.denodeify(fs.writeFile);

function sendAndPersist(data) {
	var promise = new Promise(function(resolve, reject) {
		if (data.message.attachments.length < 1) {
			console.log('No new post');
			resolve(data);
			return;
		}

		var slack = new Slack();
	    slack.setWebhook(data.webhookUri);

		slack.webhook(data.message, function(error, response) {
			if (!error) {
				writeFs(
					'./var/data.json',
					JSON.stringify({store : data.store})
				).then(function(val) {
					console.log('Saved.');
					resolve(data);
				})
				.catch(function(err) {
					console.error('writeFs: ' + err);
					reject(data);
				});
			} else {
				console.error(error);
			}
		});
	});
	return promise;
}

function requestImg(data) {
	var promise = new Promise(function(resolve, reject) {
		request(data.url, function(err, response, body) {
			if (err) {
				console.error(err);
				reject(data);
			}
			$ = cheerio.load(body);
			data.imgName = $('a')[5].attribs.href;
			resolve(data);
		});
	});
	return promise;
}

function loadData(data) {
	var promise = new Promise(function(resolve, reject) {
		readFs('./var/data.json', 'utf8')
		.then(function(val) {
			console.log(val);
			var obj = JSON.parse(val);

			data.store = obj.store || {};
			console.log(data);
			resolve(data);
		})
		.catch(function(err) {
			console.error(err);
			resolve(data);
		});
	});
	return promise;
}

loadData(data).then(nokedli.updateNokedli).then(sendAndPersist);
