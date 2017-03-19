const Order = require('../databaseObjects/Order');
const redis = require('redis');
const Promise = require('bluebird');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var expect = chai.expect;
var assert = chai.assert;
chai.should();

Promise.promisifyAll(redis.RedisClient.prototype);
const client = redis.createClient();
var dbo = Order(client);

describe('Order dbo methods', function() {
    beforeEach(function() {
        client.setAsync('order:test1','1')
        .then(client.hsetAsync('order:test1:data', 'Elek', 'hot wings'))
        .then(client.delAsync('order:test'))
        .then(client.delAsync('order:test:data'));
    });

    afterEach(function() {
        client.delAsync('order:test')
        .then(client.delAsync('order:test:data'));
    });

    it('Creating new order', function() {
        return dbo.createOrder('test').should.eventually.be.fulfilled;
    });

    it('Fail on creating already existing order', function() {
        return dbo.createOrder('test1').should.eventually.be.rejected;
    });
});
