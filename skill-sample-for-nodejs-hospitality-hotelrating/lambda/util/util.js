// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

'use strict';

const AWS = require('aws-sdk');
const config = require('./config');

const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4'
});

module.exports = {

     /**
     * Returns the target intent name
     * 
     * @param {Object} handlerInput 
     */
     parseIntent(handlerInput) {
        if(handlerInput.requestEnvelope.request.type === 'IntentRequest' || handlerInput.requestEnvelope.request.type == 'UserEvent') {
            return handlerInput.requestEnvelope.request.intent.name;
        } else {
            return handlerInput.requestEnvelope.request.type;
        }
    },

    getS3PreSignedUrl(s3ObjectKey) {
        const bucketName = config.S3_BUCKET_NAME;
        const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: s3ObjectKey,
            Expires: 60*2// the Expires is capped for 2 minute
        });
        return s3PreSignedUrl;
    },

    /**
     * Get the attribute's value from session attributes map
     * @param {*} handlerInput 
     * @param {*} attribute_name 
     * @returns session attributes object
     */
    getSessionAttribute(handlerInput, attribute_name) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return sessionAttributes[attribute_name];
    },

    /**
     * Save attribute's value to session attributes map
     * @param {*} handlerInput 
     * @param {*} attribute_name 
     * @param {*} attribute_value 
     */
    storeSessionAttribute(handlerInput, attribute_name, attribute_value) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes[attribute_name] = attribute_value;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    },

    /**
     * Gets the root value of the slot even if synonyms are provided.
     *
     * @param {Object} handlerInput
     * @param {String} slot
     * @returns {String} The root value of the slot
     */
    getSlotResolution(handlerInput, slot) {
        const intent = handlerInput.requestEnvelope.request.intent;
        if (
            intent.slots[slot] &&
            intent.slots[slot].resolutions &&
            intent.slots[slot].resolutions.resolutionsPerAuthority[0]
        ) {
            const resolutions = intent.slots[slot].resolutions.resolutionsPerAuthority;

            for (let i = 0; i < resolutions.length; i++) {
                const authoritySource = resolutions[i];

                if (
                    authoritySource.authority.includes('amzn1.er-authority.echo-sdk.') &&
                    authoritySource.authority.includes(slot)
                ) {
                    if (authoritySource.status.code === 'ER_SUCCESS_MATCH') {
                        if (authoritySource.values[0].value.id == null )
                            return authoritySource.values[0].value.name;
                        else {
                            return authoritySource.values[0].value.id;
                        }
                    }
                }
            }
            return "";
        } else if (intent.slots[slot].value && !intent.slots[slot].resolutions) {
            // For built-in intents that haven't been extended with ER
            return intent.slots[slot].value;
        }

        return "";
    },
}