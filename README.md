# Objective
Reingest the old logs from the cloudwatch to the elasticsearch domain

# Architecture
![Process AWS Logs](https://i.ibb.co/Cs94wbX/aws-infra.png "Process AWS Logs")

# Prerequisits
## ES domain with subscriber lambda
1. Setup a new ES domain with zero replica as per the already existing process
2. Make sure the subscriber lambda code is optimized as per the newly updated code to avoid sending logs matching certain patterns
3. Insert some logs in one of the log group to verify the logs are reaching the kibana domain

# Detailed steps for setting up new AWS Infra 

## Step 1 | Setup S3 bucket with required permissions
1. Create a new private S3 bucket in the same region from which logs are to be exported (e.g. us-west-2)
2. Update bucket permissions so it can be accessed by the cloudwatch logs, sample available at [s3-policy.json](./policies/s3-policy.json) [NOTE: update bucket name and aws region to correct values]  

>Ref: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3ExportTasksConsole.html


## Step 2 | Create a SQS to recieve events from S3 bucket
1. Create a new SQS in the same region as S3.
2. Update SQS permissions to receive events from the S3. Refer [sqs-policy.json](./policies/sqs-policy.json) [NOTE: update bucket name, queue name, account id, and aws region to correct values] 
3. Attach a DLQ to the sqs to recieve any unprocessed message if encountered

>Ref: https://docs.aws.amazon.com/AmazonS3/latest/userguide/grant-destinations-permissions-to-s3.html 

## Step 3 | Publish S3 events to SQS
1. In S3 console, configure event notifications
2. Check 'All Object Creation' events 
3. Add suffix of '.gz' to filter the events for gzip files only
4. In destination, choose the queue created in previous step

> Ref: https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-event-notifications.html

## Step 4 | Create a Lambda function to consume SQS message
1. Create a new lambda funcion with node14 runtime
2. Add sqs created in step 2 as the trigger
3. Copy the lambda code from the [index.js](./index.js)
4. For lambda role, create a new role with the permissions mentioned in [lambda-policy.json](./policies/lambda-policy.json) 
[NOTE: update bucket name, queue name, account id, aws region, subscriber lambda name to correct values] 
5. Set environment variables FORWARDER_LAMBDA providing name of the forwarder lambda function

## Step 5 | Verify the configurations
1. For Lambda, make sure to set the following configurations (adding example values alongside)
    - Memory Value (512MB)
    - Timeout (2 min)
    - Concurrency (1) [NOTE: a single invocation of sqs lambda may invoke subscriber lambda multiple times]
    - SQS batch size (1)
2. For SQS, make sure to set the following configurations (adding example values alongside)
    - visibility timeout (6 min) [NOTE: It should be more than lambda timeout]


# Process the log groups
1. Go to desired log group in cloudwatch whose logs are to be exported.
2. Click on the actions and click 'Export Data to Amazon S3' 
3. Enter the start and end date and start the export job.
4. It should export the logs to kibana
