// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

'use strict';

const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const config = require('../util/config');

module.exports = {

    /**
     * Send a message to the SNS topic
     * @param {*} msg 
     */
    async publish_message_sns(msg) {
        // Create an SNS client instance
        const snsClient = new SNSClient({});

        // Define the parameters for the publish action
        const params = {
            Message: msg, // Your message
            TopicArn: config.sns_topic_arn, // Your topic ARN
        };

        console.log(params)
        try {
            // Create a new PublishCommand instance
            const command = new PublishCommand(params);
            // Send the command to SNS
            const response = await snsClient.send(command);

            if (response['$metadata']['httpStatusCode'] == 200) {
                console.log("Message published to SNS:", response);
            } else {
                console.log("Message was failed to publish to SNS:", response);
            }            
        } catch (err) {
            console.error("Error publishing to SNS:", err);
        }
    }
}