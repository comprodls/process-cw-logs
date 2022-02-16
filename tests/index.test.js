'use strict';

const lambda = require('../index.js');
const chai = require('chai');
const expect = chai.expect;
const event = require('./event');

const invokedFunctionArn = "" //Provide ARN of the lambda
var context = {
  "invokedFunctionArn": invokedFunctionArn
};

describe('Test KK Proxy Lambda', function () {
    it('verify status code 200', async () => {
        const result = await lambda.handler(event, context)

        // expect(result.statusCode).to.be.equal(200);
    });
});
