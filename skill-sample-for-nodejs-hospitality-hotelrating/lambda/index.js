// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
"use strict";

// Libary helper modules
const Alexa = require('ask-sdk-core');
const aplUtil = require("./apl.js");

const interceptors = require('./interceptors/interceptors_req.js')
const util = require('./util/util.js')

// For AWS Pinpoint
const sms = require('./aws/sms.js');
const staffSMSNumber = 'INSERT A VALID MOBILE NUMBER YOU WANT TO SEND SMS MESSAGE TO';     

// For AWS SNS
const sns = require('./aws/sns.js')

/**
 * The launch request handler handles both the skill cold launch as well as the skill connection
 * task rating. 
*/
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        let speakOutput = requestAttributes.t('WELCOME_PROMPT');
        let task = handlerInput.requestEnvelope.request.task;
        let rating = 3;  

        if (task) {
            switch (task.name) {
                case 'amzn1.ask.skill.8fc28a64-828a-490c-b2d3-f18c329f5509.rating':
                    rating = task.input['rating'];
                    if (rating > 5) {
                        rating = 5;
                    } else if (rating < 1) {
                        rating = 1;
                    }                  
                    return RatingIntentHandler.handle(handlerInput, rating);
                default:
                    break;
            }    
        }

        const payload = require('./data_ca/ratingdata.json');
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            let document = require('./apl/rating.json');          
            const aplDirective = aplUtil.createDirectivePayload(document, payload);

            responseBuilder.addDirective(aplDirective);
        }
    
        return responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler handles the touch event from the rating component of the hotel rating page.
*/
const RatingEventHandler = {
    canHandle(handlerInput){
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent'
            && handlerInput.requestEnvelope.request.source.id === 'hotelRating';
    },
    handle(handlerInput){
        const { attributesManager, responseBuilder } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();

        var speakOutput = requestAttributes.t('THANKYOU_PROMPT');
        speakOutput = getSpeechOutputByRating(handlerInput.requestEnvelope.request.arguments[1], handlerInput);
        return responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
}

/**
 * Helper function to output correct response based on the rating.
*/
function getSpeechOutputByRating(inputRating, handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    var rating = parseInt(inputRating);
    var speakOutput = "";
    var txtOuptut = "";

    if(rating <= 3){
        speakOutput = requestAttributes.t('NEGATIVE_PROMPT');
        txtOuptut = requestAttributes.t('STAFF_TEXT_MESSAGE').replace('@RATING@', rating).replace('@UNITNAME@', util.getSessionAttribute(handlerInput, 'unit_name'));

        handlerInput.responseBuilder.addDirective(
            aplUtil.getSadRatingAPLDirectiveBasic()
        );
        // text number should be changed so that it is a valid mobile number that can receive SMS texts
        // Comment out the following if you do not want to use sms service
        sms.SendSMSMessage(txtOuptut, staffSMSNumber);

        //send the bad rating review message to SNS
        sns.publish_message_sns(txtOuptut)

    } else if (rating >= 4) {
        speakOutput = requestAttributes.t('POSITIVE_PROMPT');        
        responseBuilder.addDirective(aplUtil.getHappyRatingAPLDirectiveBasic());
    } else {
        console.log("Unexpected rating received: " + rating);
        speakOutput = requestAttributes.t('THANKYOU_PROMPT');        
    }
    return speakOutput;
}

/**
 * This intent handler is used to handle input of rating by hotel guest who choose to use voice instead of touch
*/
const RatingIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RatingIntent';
    },
    handle(handlerInput, rating) {
        let ratingValue = 0;

        let speakOutput = "";
        if (rating) {
            ratingValue = rating;
        } else {
            ratingValue = handlerInput.requestEnvelope.request.intent.slots.rating.value;
        }
        speakOutput = getSpeechOutputByRating(ratingValue, handlerInput);

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // execute an APL command to change the rating value for the AlexaRating component in the document
            const aplDirective = aplUtil.setRatingPayload(ratingValue);
            handlerInput.responseBuilder.addDirective(aplDirective);
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

/**
 * Handler for AMAZON.HelpIntent
*/
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();    
        const speakOutput = requestAttributes.t('HELP_PROMPT');        

        return responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for AMAZON.CancelIntent and AMAZON.StopIntent
*/
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();    
        const speakOutput = requestAttributes.t('EXIT_PROMPT');        

        return responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesnt map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ignored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();    
        const speakOutput = requestAttributes.t('FALLBACK_PROMPT');        

        return responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/* *
 * Handler for SessionEndedRequest, this is invoked prior to skill exiting skill session, giving the 
 * skill a chance to save state before exiting.
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); 
    }
};

/**
 * ErrorHandler for the skill, invoked when there is non-recoverable error from the skill handler.
*/
const ErrorHandler = {
        canHandle(handlerInput, error) {
            let { request } = handlerInput.requestEnvelope;
            console.log("ErrorHandler: checking if it can handle " +
                request.type + ": [" + error.name + "] -> " + !!error.name);
            return !!error.name;
        },
        handle(handlerInput, error) {
            const { attributesManager, responseBuilder } = handlerInput;
            const requestAttributes = attributesManager.getRequestAttributes();    
            const speakOutput = requestAttributes.t('ERROR_PROMPT');        
    
            console.log("Global.ErrorHandler: error = " + error.message);

            return responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    };


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RatingIntentHandler,
        RatingEventHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler)
    .addRequestInterceptors(interceptors.LocalizationInterceptor, interceptors.RequestInterceptor, interceptors.aspUnitInfoInterceptor)
    .addResponseInterceptors(interceptors.ResponseInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();