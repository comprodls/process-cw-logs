# Objective
Reingest the old logs from the cloudwatch to the elasticsearch domain

# Architecture
![Process AWS Logs](https://i.ibb.co/Cs94wbX/aws-infra.png "Process AWS Logs")

# Setup Infra

1. Create a S3 bucket and add permissions to it so that logs can be exported. Refer: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3ExportTasksConsole.html
2. Create a sqs and add s3 notification to push the create object notifications to the sqs. Refer: https://docs.aws.amazon.com/AmazonS3/latest/userguide/enable-event-notifications.html
3. Create a lambda function and add sqs as the trigger. Refer: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-lambda-function-trigger.html
4. provide lambda functions the permissions, refer 'policy.json' file

# create an export task

Create an export task for a cloudwatch log group and the selected date range by following the steps in https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3ExportTasksConsole.html
This will start exporting the logs to S3 which in turn will trigger the complete cycle to export the data to the elasticsearch domain
