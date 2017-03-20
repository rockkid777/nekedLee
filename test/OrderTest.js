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
        client.setAsync('order:test1:team0','1')
        .then(client.hsetAsync('order:test1:team0:data', 'Elek', 'hot wings'))
        .then(client.delAsync('order:test0:team0'))
        .then(client.delAsync('order:test0:team0:data'));
    });

    afterEach(function() {
        client.delAsync('order:test0:team0')
        .then(client.delAsync('order:test0:team0:data'));
    });

    it('Creating new order', function() {
        return dbo.createOrder('test0:team0').should.eventually.be.fulfilled;
    });

    it('New order should be empty', function() {
        return dbo.createOrder('test0:team0').should.eventually.be.deep.equal({});
    });

    it('Fail on creating already existing order', function() {
        return dbo.createOrder('test1:team0').should.eventually.be.rejected;
    });

    it('Added item should be present', function() {
        return (dbo.addItemToOrder('test1:team0', 'adam', 'Cheeseburger')
        .then(() => dbo.getOrder('test1:team0'))
        .should.eventually.be.deep.equal({'adam':'Cheeseburger', 'Elek': 'hot wings'}));
    });

    it('New item from same user should override the last one', function() {
        return (dbo.addItemToOrder('test1:team0', 'adam', 'Cheeseburger')
        .then(() => dbo.addItemToOrder('test1:team0', 'adam', 'Pizza'))
        .then(() => dbo.getOrder('test1:team0'))
        .should.eventually.be.deep.equal({'adam':'Pizza', 'Elek': 'hot wings'}));
    });

    it('Getting order with nonexisting id should return null', function() {
        return (dbo.getOrder('test0:team0')
        .should.eventually.be.equal(null));
    });

    it('IsOpen on an open order should return true', function() {
        return (dbo.createOrder('test0:team0')
        .then(() => dbo.isOpen('test0:team0'))
        .should.be.eventually.be.true);
    });

    it('IsOpen on a closed order should return false', function() {
        return (dbo.createOrder('test0:team0')
        .then(() => dbo.closeOrder('test0:team0'))
        .then(() => dbo.isOpen('test0:team0'))
        .should.be.eventually.be.false);
    });

    it('Removing existing item from order should pass', function() {
        return dbo.removeItemFromOrder('test1:team0', 'Elek')
        should.be.eventually.fulfilled;
    });

    it('Removing nonexisting item from order should fail', function() {
        return dbo.removeItemFromOrder('test1:team0', 'adam')
        should.be.eventually.rejected;
    });

    it('Listing sholud be fine', function() {
        return dbo.listOrdersWithSuffix(':team0').should.be.eventually.have.length(1);
    });
});
