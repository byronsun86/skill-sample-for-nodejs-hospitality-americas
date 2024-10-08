// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/


module.exports = Object.freeze({
    //secrets manager region
    secrets_mgr_region: '<replace with your secret mgr region>',

    //secret name where you save your 3p API access token
    secrets_mgr_secret_name: '<replace with your secret name>',

    //3p API access token key name
    secrets_mgr_asp_access_token_key: '<replace with your access token key name>',

    //ASP API call endpoint
    asp_api_endpoint: '<replace with your region asp api endpoint, Ex for NA: https://api.amazonalexa.com>',

    //SNS topics ARN where you will publish the message to
    sns_topic_arn: '<replace with your own SNS topics ARN>'
});