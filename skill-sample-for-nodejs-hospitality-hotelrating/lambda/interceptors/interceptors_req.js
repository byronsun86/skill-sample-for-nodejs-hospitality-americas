// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

"use strict";

// Libary helper modules
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const asp_apis = require('../asp/asp_apis')
const util = require('../util/util');

module.exports = {
    
/**
 * RequestInterceptor logs the incoming request, used for debugging
*/
    RequestInterceptor: {
        process(handlerInput) {
            let { attributesManager, requestEnvelope } = handlerInput;
            let sessionAttributes = attributesManager.getSessionAttributes();

            console.log(`==Request==${JSON.stringify(requestEnvelope)}`);
            console.log(`==SessionAttributes==${JSON.stringify(sessionAttributes, null, 2)}`);
        }
    },


/**
 * This request interceptor will bind a translation function 't' to the handlerInput
*/
    LocalizationInterceptor:{
        process(handlerInput) {
            const languageStrings = {
                'en-US': require('languages/en-US.js'),
                //example of localization for other locale other than en-US
                'en-CA': require('languages/en-CA.js')
            };

            const localizationClient = i18n.use(sprintf).init({
                lng: Alexa.getLocale(handlerInput.requestEnvelope),
                resources: languageStrings,
            });

            localizationClient.localize = function localize() {
                const args = arguments;
                const values = [];
                
                for (let i = 1; i < args.length; i += 1) {
                    values.push(args[i]);
                }
                
                const value = i18n.t(args[0], {
                    returnObjects: true,
                    postProcess: 'sprintf',
                    sprintf: values,
                });

                if (Array.isArray(value)) {
                    return value[Math.floor(Math.random() * value.length)];
                }
                return value;
            };

            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            requestAttributes.t = function translate(...args) {
                return localizationClient.localize(...args);
            };
        },
    },

    /**
     * This interceptor will get the persistent unit Id of the source unit associated with the device for requests to this skill.
     * Persistent unit Id will be saved 
     */
    aspUnitInfoInterceptor: {
        async process (handlerInput){
            try {
                if (handlerInput.requestEnvelope.session && handlerInput.requestEnvelope.session.new) {                        
                    let persistent_uid = '';
                    let unit_name = '';
                    
                    //Get persistent unit id if the skill is launched through skill connection's task 
                    if (handlerInput.requestEnvelope.request.hasOwnProperty('task')) {
                        persistent_uid = handlerInput.requestEnvelope.request.task.input.unitId;
                        console.log(`persistent unit id from task: ${persistent_uid}`);
                    } 
                    //Get persistent unit id if the skill is launched through voice
                    else if (handlerInput.requestEnvelope.context.System.unit && handlerInput.requestEnvelope.context.System.unit.persistentUnitId) {
                        persistent_uid = handlerInput.requestEnvelope.context.System.unit.persistentUnitId;
                        console.log(`persistent unit id: ${persistent_uid}`);
                    }

                    if (persistent_uid != '') {
                        unit_name = await asp_apis.get_asp_unit_name(persistent_uid);
                        console.log(`unit name: ${unit_name}`);
                    }

                    //Save persistent unit Id and unit name to session attributes
                    if (unit_name != '') {
                        util.storeSessionAttribute(handlerInput, 'puid', persistent_uid);
                        util.storeSessionAttribute(handlerInput, 'unit_name', unit_name);
                    }                        
                }
            } catch (error) {
                console.error(`REQUEST ERROR ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
                console.error(error);
            }
        }
    },

    /**
     * ResponseInterceptor logs the outgoing response, used for debugging
    */   
    ResponseInterceptor: {
        process(handlerInput) {

            let { attributesManager, responseBuilder } = handlerInput;
            let response = responseBuilder.getResponse();
            let sessionAttributes = attributesManager.getSessionAttributes();

            // Log the response for debugging purposes.
            console.log(`==Response==${JSON.stringify(response)}`);
            console.log(`==SessionAttributes==${JSON.stringify(sessionAttributes, null, 2)}`);
        }   
    }
}
