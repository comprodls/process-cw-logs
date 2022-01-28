const path = require('path');
const AWS = require('aws-sdk');
const readline = require('readline');
const zlib = require('zlib');

const cloudwatchlogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_DEFAULT_REGION
});
const s3 = new AWS.S3();

const regexp = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/;

exports.handler = async (event, context) => {
    const accountOwner = JSON.stringify(context.invokedFunctionArn).split(':')[4];

    for (const { messageId, body } of event.Records) {
        const awsLogs  = {
          messageType: "DATA_MESSAGE",
          owner: accountOwner,
          logEvents:[]
        };
        
        const message = body.Records[0];
        if(!message.eventSource == "aws:s3"){
          return;
        }
        const bucket = message.s3.bucket.name;
        const file = message.s3.object.key;
       
        if(path.extname(file) == ".gz"){
          const pathlevels = file.split("/");

          awsLogs.logStream = pathlevels[pathlevels.length - 2].replace(/\//g, "-");

          const taskId = pathlevels[pathlevels.length - 3];
          const taskdetails = await cloudwatchlogs.describeExportTasks({taskId}).promise();
          awsLogs.logGroup = taskdetails.exportTasks[0].logGroupName;

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
              if(result){
                awsLogs.logEvents.push({
                  "timestamp": new Date(result[0]).getTime(),
                  "message": currentline.substring(result[0].length + 1)
                })
              }
            }
          }

          var bufferObject = new Buffer.from(JSON.stringify(awsLogs));
          const gz = zlib.gzipSync(bufferObject).toString('base64')
          console.log(gz)
        }
    }
    return `Successfully processed ${event.Records.length} messages.`;
};
