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

describe('Order', function() {
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

    it('New order should be empty', function() {
        return dbo.createOrder('test').should.eventually.be.deep.equal({});
    });

    it('Fail on creating already existing order', function() {
        return dbo.createOrder('test1').should.eventually.be.rejected;
    });

    it('Added item should be present', function() {
        return (dbo.addItemToOrder('test1', 'adam', 'Cheeseburger')
        .then(() => dbo.getOrder('test1'))
        .should.eventually.be.deep.equal({'adam':'Cheeseburger'}));
    });

    it('New item from same user should override the last one', function() {
        return (dbo.addItemToOrder('test1', 'adam', 'Cheeseburger')
        .then(() => dbo.addItemToOrder('test1', 'adam', 'Pizza'))
        .then(() => dbo.getOrder('test1'))
        .should.eventually.be.deep.equal({'adam':'Pizza'}));
    });

    it('Getting order with nonexisting id should return null', function() {
        return (dbo.getOrder('test')
        .should.eventually.be.equal(null));
    });

    it('IsOpen on an open order should return true', function() {
        return (dbo.createOrder('test')
        .then(() => dbo.isOpen('test'))
        .should.be.eventually.be.true);
    });

    it('IsOpen on a closed order should return false', function() {
        return (dbo.createOrder('test')
        .then(() => dbo.closeOrder('test'))
        .then(() => dbo.isOpen('test'))
        .should.be.eventually.be.false);
    });

});
