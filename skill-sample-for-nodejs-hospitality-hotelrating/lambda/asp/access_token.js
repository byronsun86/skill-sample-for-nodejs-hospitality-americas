// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

const sm = require('@aws-sdk/client-secrets-manager');
const config = require('../util/config');

module.exports = {

    /**
     * 
     * This method will retrieve the access token which required by the ASP API authenrication
     * from secrets manager. In order to retrieve the access token, you need to know 
     * 1. the region where you setup the secrets manager
     * 2. the secret name where you manage your access token 
     * 3. the key name of ASP API access token 
     * 
     * @returns the access token which required by the ASP API authenrication 
     */
    async get_asp_api_access_token (){
        const secret_name = config.secrets_mgr_secret_name; 
        const client = new sm.SecretsManagerClient({
            region: config.secrets_mgr_region,
        });

        let response;
        try {
            response = await client.send(
                new sm.GetSecretValueCommand({
                    SecretId: secret_name,
                    VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
                })
            );
        } catch (error) {
            console.error(error)
            throw error;
        }

        return `Bearer ${JSON.parse(response.SecretString)[config.secrets_mgr_asp_access_token_key]}`;
    }
}