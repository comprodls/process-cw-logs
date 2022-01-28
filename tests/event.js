module.exports = {
  "Records": [
    {
      "messageId": "9ced0bf5-3638-4cf4-9fda-6ea5ef9ed15d",
      "body": {
        "Records": [
          {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "ap-south-1",
            "eventTime": "2022-01-24T09:38:42.390Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
              "principalId": "AWS:AIDAQBYURW4AQZCG3VUYY"
            },
            "requestParameters": {
              "sourceIPAddress": "49.36.205.80"
            },
            "responseElements": {
              "x-amz-request-id": "Q2YA7BZEHQ9W6FG9",
              "x-amz-id-2": "mXuWHjtYzJ+DuJbGs94GhkTiGWrSEN7Yp0+mUXeEPgy860SH4ihYQTCGELTTFo8HZf/j6rwPq16h7BOTkXqGKkxTl4z4p73pxFfVrMFBIOM="
            },
            "s3": {
              "s3SchemaVersion": "1.0",
              "configurationId": "logs-notifcation",
              "bucket": {
                "name": "sam-build-artifacts-apsouth1",
                "ownerIdentity": {
                  "principalId": "A1NJUQUPTWUD9F"
                },
                "arn": "arn:aws:s3:::sam-build-artifacts-apsouth1"
              },
              "object": {
                "key": "export1/be4072a7-ff20-4e98-a61a-40d63d5a414f/2022-01-18-[$LATEST]2f2faf726d06475489c93fe6f5a69d21/000000.gz",
                "size": 8,
                "eTag": "db22eb6f271f4e4be4ba5d01a0adb69d",
                "sequencer": "0061EE73A25CBA077D"
              }
            }
          }
        ]
      }
    }
  ]
}