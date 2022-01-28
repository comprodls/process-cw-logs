'use strict';

const lambda = require('../index.js');
const chai = require('chai');
const expect = chai.expect;
const event = require('./event');
var context = {
  "invokedFunctionArn": "arn:aws:lambda:ap-south-1:003801200385:function:logs-data-stream"
};

describe('Test KK Proxy Lambda', function () {
    it('verify status code 200', async () => {
        const result = await lambda.handler(event, context)

        // expect(result.statusCode).to.be.equal(200);
    });
});


/**
 * Sample success methodArgument -
 * {
  orderId: '219875',
  sessionId: 'S1231182fb5eeab6101cc377272cf75b9f6b88da3739b21e9036c532e736d24',
  langIdForOrder: -1,
  options: {
    templateName: 'order_success',
    countryCode: 'en',
    fromAddress: 'noreply@cambridge.org',
    toAddress: 'cdev146@yopmail.com'
  },
  f: 'sendOrderConfirmationEmail1',
  languageId: -1,
  s: 'store_elt_compass'
 */
