const path = require('path');
const AWS = require('aws-sdk');
const readline = require('readline');
const zlib = require('zlib');

const cloudwatchlogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_DEFAULT_REGION
});
const s3 = new AWS.S3();

const regexp = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/;

const logForwardLambda = 'logs-data-stream';
const lambda = new AWS.Lambda({
  region: process.env.AWS_DEFAULT_REGION
});
exports.handler = async (event, context) => {
  try {
    const accountOwner = JSON.stringify(context.invokedFunctionArn).split(':')[4];

    for (const { messageId, body } of event.Records) {
      const message = body.Records[0];
      if (message.eventSource != "aws:s3") {
        return;
      }

      const file = message.s3.object.key;
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

      for await (const currentline of rl) {
        if (currentline.length > 0) {
          const result = currentline.match(regexp);
          if (result) {
            awsLogs.logEvents.push({
              "timestamp": new Date(result[0]).getTime(),
              "message": currentline.substring(result[0].length + 1)
            })
          }
        }
      }

      const data = gzipLogs(awsLogs);

      const params = {
        FunctionName: logForwardLambda,
        InvocationType: 'Event',
        Payload: JSON.stringify({ awslogs: { data } })
      };

     lambda.invoke(params, (err, result));
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
    logEvents:[],
    data: null
  };

  const pathlevels = file.split("/");
  const taskId = pathlevels[pathlevels.length - 3];
  const taskdetails = await cloudwatchlogs.describeExportTasks({taskId}).promise();
  awsLogs.logGroup = taskdetails.exportTasks[0].logGroupName;
  awsLogs.logStream = pathlevels[pathlevels.length - 2].replace(/-/g, "/");

  return awsLogs;
}

function gzipLogs(awsLogs) {
  var bufferObject = new Buffer.from(JSON.stringify(awsLogs));
  const gz = zlib.gzipSync(bufferObject).toString('base64')
  console.log(gz)
  return gz;
}
