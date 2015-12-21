#!/usr/bin/env node

var fs = require('fs'),
    request = require('request'),
    _ = require('underscore'),
    moment = require('moment'),
    logger = require('./logger'),
    tryJSON = require('../lib/tryParseJSON'),
    config = require('../config');

module.exports = function(cb) {

    var storeDir = 'dist/data';

    var defaultReq = {
        method: 'GET'
    };

    
    request(_.extend(defaultReq, {
        url: config.apiUrl + '/project/getChildrenIds/' + config.projectId
    }), function(err, res, body){
        var ids = tryJSON(body) || [];
        ids.push(config.projectId);
        
        var eventsReq = {
            url: config.apiUrl + '/event/find',
            qs: {
                '@select': 'id,name,project.id,project.name,shortDescription,classificacaoEtaria,terms,traducaoLibras,descricaoSonora',
                '@files': '(avatar,header):url',
                'project': 'in(' + ids + ')'
            }
        };
        request(_.extend(defaultReq, eventsReq), function(err, res, body) {
            if(err) {
                logger.err(err);
            } else {
                var events = tryJSON(body);

                if(!events || !events.length) {
                    logger.error('This project has no events');
                    events = [];
                } else {
                    logger.log('Downloaded', body.length, 'bytes,', events.length, 'events');
                }

                var eventIds = [];

                _.each(events, function(event) {
                    eventIds.push(event.id);
                });

                eventIds = eventIds.join(',');

                var occursReq = {
                    url: config.apiUrl + '/eventOccurrence/find?event=in(' + eventIds + ')',
                    qs: {
                        '@select': 'id,eventId,rule',
                        '@order': '_startsAt'
                    }
                };

                var occursReqUrl = config.apiUrl + '/eventOccurrence/find?@select=id,eventId,rule&event=in(' + eventIds + ')&@order=_startsAt';

                request(occursReqUrl, function(err, res, body) {

                    if(err) {

                        console.log(err);

                    } else {

                        var occurrences = tryJSON(body) || [];

                        var spaceIds = [];

                        _.each(occurrences, function(occurrence) {

                            // Store space id for following spaces request

                            spaceIds.push(occurrence.rule.spaceId);

                            // Find event
                            var event = _.find(events, function(e) { return e.id == occurrence.eventId; });

                            // Push occurrence to event
                            if(!event.occurrences)
                                event.occurrences = [];

                            event.occurrences.push(occurrence.rule);

                        });

                        // Remove events without occurrence
                        events = _.filter(events, function(e) { return e.occurrences && e.occurrences.length; });

                        // Organize event by time of first occurrence
                        events = _.sortBy(events, function(e) {
                            return moment(e.occurrences[0].startsOn + ' ' + e.occurrences[0].startsAt, 'YYYY-MM-DD HH:mm').unix();
                        });

                        // Remove duplicate spaces
                        spaceIds = _.uniq(spaceIds).join(',');

                        var spacesReq = {
                            url: config.apiUrl + '/space/find',
                            qs: {
                                '@select': 'id,name,shortDescription,endereco,location',
                                '@files': '(avatar.viradaSmall,avatar.viradaBig):url',
                                'id': 'in(' + spaceIds + ')',
                                '@order': 'name'
                            }
                        };

                        request(_.extend(defaultReq, spacesReq), function(err, res, body) {

                            if(err) {
                                console.log(err);
                            } else {

                                var spaces = tryJSON(body) || [];

                                fs.writeFile(storeDir + '/events.json', JSON.stringify(events), function(err) {
                                    if(err) console.log(err);
                                });

                                fs.writeFile(storeDir + '/occurrences.json', JSON.stringify(occurrences), function(err) {
                                    if(err) console.log(err);
                                });

                                fs.writeFile(storeDir + '/spaces.json', JSON.stringify(spaces), function(err) {
                                    if(err) console.log(err);
                                });

                                if(typeof cb == 'function')
                                    cb({
                                        events: events,
                                        occurrences: occurrences,
                                        spaces: spaces
                                    });

                            }

                        })
                    }
                });
            }
        });
    });
    

};

if(!module.parent) {
    module.exports();
}