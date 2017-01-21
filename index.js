var request = require('request')
,   Promise = require('promise')
,   fs      = require('fs')
,   Slack   = require('slack-node')
,   cheerio = require('cheerio')
,   config  = require('./var/config.js');

var data = {
	imgBaseUrl: 'http://nokedlikifozde.hu/wp-content/uploads/',
	url: 'http://nokedlikifozde.hu/wp-content/uploads/?C=M;O=D;F=1',
	message: {
		username: 'Neked Lee',
		icon_emoji: ':ramen:',
	    attachments: []
	},
	webhookUri: config.webhookUri,
	oldImgName: '',
	imgName: ''
};

var readFs = Promise.denodeify(fs.readFile);
var writeFs = Promise.denodeify(fs.writeFile);

function sendAndPersist(data) {
	var promise = new Promise(function(resolve, reject) {
		if (data.imgName === data.oldImgName) {
			console.log('No new post');
			resolve(data);
		}

		data.message.attachments.push({
			text: 'A Nokedli új képet rakott ki! :wink:',
			image_url: (data.imgBaseUrl + data.imgName)
		});

		var slack = new Slack();
		var sendWebhook = Promise.denodeify(slack.webhook);
	    slack.setWebhook(webhookUri);

		sendWebhook(data.message).then(function(val) {
			writeFs(
				'./var/data.json',
				JSON.stringify({oldImgName : data.imgName})
			).then(function() { console.log('Saved.'); resolve(data); })
			.catch(function(err) { console.error(err); reject(data); });
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
			if (obj.hasOwnProperty('oldImgName')) {
				data.oldImgName = obj.oldImgName;
				resolve(data);
			} else {
				console.error('Invalid data file.');
				resolve(data);
			}
		})
		.catch(function(err) {
			console.error(err);
			resolve(data);
		});
	});
	return promise;
}

loadData(data).then(requestImg).then(sendAndPersist);
