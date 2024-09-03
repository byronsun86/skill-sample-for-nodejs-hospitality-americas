// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

const axios = require('axios')
const asp_api_token = require('./access_token.js');
const config = require('../util/config.js')


module.exports = {

    /**
     * Get unit name 
     * @param {*} unitId the persistent Unit Id, the identifier for the unit 
     */
    async get_asp_unit_name(unitId) {

        let token = await asp_api_token.get_asp_api_access_token();
        let get_url = `${config.asp_api_endpoint}/v2/units/${unitId}`;

        const api_config = {
            headers: {
                Authorization: token,
                Accept: 'application/json'
            }
        };

        return axios.get(get_url, api_config)
            .then(response => {
                console.log(response.data);
                return response.data.name.value.text;
            })
            .catch(function (error) {
                if (error.response) {
                    console.error(`Response Error Status and Data: ${error.response.status}:${error.response.data}`)
                    console.error(`Response header: ${error.response.headers}`);
                } else if (error.request) {
                    console.error(`Request Error: ${error.request}`);
                } else {
                    console.error('Error:', error.message);
                }
            })
    },

}