const path = require('path');
const AWS = require('aws-sdk');
const readline = require('readline');
const zlib = require('zlib');

const cloudwatchlogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

const regexp = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/;

const logForwardLambda = process.env.FORWARDER_LAMBDA;
const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION
});

const fileSizeLimit = 200 * 1000;
exports.handler = async (event, context) => {
  try {
    const accountOwner = JSON.stringify(context.invokedFunctionArn).split(':')[4];

    for (const { messageId, body } of event.Records) {
      const message = JSON.parse(body).Records[0];
      if (message.eventSource != "aws:s3") {
        return;
      }

      const file = decodeURIComponent(message.s3.object.key);
      if(path.extname(file) != ".gz") {
        return;
      }

      let awsLogs = await getLogParams(message, file, accountOwner);

      const bucket = message.s3.bucket.name;
      const s3ReadStream = s3.getObject({
          Bucket: bucket,
          Key: file
      }).createReadStream().pipe(zlib.createGunzip());

      const rl = readline.createInterface({
        input: s3ReadStream,
        terminal: false
      });

      let lineSizeApprox = 0;
      let lineCount = 0;

      for await (const currentline of rl) {
        if (currentline.length > 0) {
          lineCount++;
          const result = currentline.match(regexp);
          if (result) {
            awsLogs.logEvents.push({
              "timestamp": new Date(result[0]).getTime(),
              "message": currentline.substring(result[0].length + 1)
            })
          }
        }

        lineSizeApprox = lineSizeApprox + currentline.length;
        if (lineSizeApprox > fileSizeLimit) {
          let partialData = Object.assign({}, awsLogs);
          lineSizeApprox = 0;
          awsLogs.logEvents = [];
          console.log(`${lineCount}, lines processed`);
          await invokeLambda(partialData);
        }
      }

      await invokeLambda(awsLogs)
      console.log('Processed logs for file:', file)
    }
    return `Successfully processed ${event.Records.length} messages.`;
  } catch (error) {
    console.log("Error: ", error);
  }
};

async function getLogParams(message, file, accountOwner) {
  const awsLogs = {
    messageType: "DATA_MESSAGE",
    owner: accountOwner,
    logGroup: null,
    logStream: null,
    logEvents:[]
  };

  const pathlevels = file.split("/");
  const taskId = pathlevels[pathlevels.length - 3];
  const taskdetails = await cloudwatchlogs.describeExportTasks({taskId}).promise();
  awsLogs.logGroup = taskdetails.exportTasks[0].logGroupName;
  awsLogs.logStream = pathlevels[pathlevels.length - 2].replace(/-/g, "/");

  return awsLogs;
}

async function invokeLambda(awsLogs) {
  console.log(awsLogs.logEvents.length)
  const data = gzipLogs(awsLogs);

  const params = {
    FunctionName: logForwardLambda,
    InvocationType: 'Event',
    Payload: JSON.stringify({ awslogs: { data } })
  };

  await lambda.invoke(params).promise();
}

function gzipLogs(logObj) {
  var bufferObject = new Buffer.from(JSON.stringify(logObj));
  const gz = zlib.gzipSync(bufferObject).toString('base64')
  return gz;
}
