var request = require('request')
,   Promise = require('bluebird')
,   fs      = require('fs')
,   Slack   = require('slack-node')
,   cheerio = require('cheerio')
,   config  = require('./etc/config.js')
,	Nokedli = require('./modules/nokedli.js')
,	Ferdinand = require('./modules/ferdinand.js');

var data = {
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

function loadData(data) {
	var promise = new Promise(function(resolve, reject) {
		readFs('./var/data.json', 'utf8')
		.then(function(val) {
			var obj = JSON.parse(val);

			data.store = obj.store || {};
			resolve(data);
		})
		.catch(function(err) {
			console.error(err);
			resolve(data);
		});
	});
	return promise;
}

var nokedli = new Nokedli();
var ferdinand = new Ferdinand();

loadData(data)
	.then(nokedli.update)
	.then(ferdinand.update)
	.then(sendAndPersist);
