'use strict';

angular.module('mci.events')

.filter('tagEvents', [
    'EventService',
    function(Event) {
        return function(input, tag) {
            if(tag.length > 0) {
                return _.filter(input, function(e) {
                    if(!e.terms.tag){
                        return false;
                    }
                    var has = false;
                    e.terms.tag.forEach(function(l){
                        if(tag.indexOf(l) >= 0){
                            has = true;
                        }
                    });
                    return has;
                });
            }
            return input;
        }
    }
])

.filter('linguagemEvents', [
    'EventService',
    function(Event) {
        return function(input, linguagem) {
            if(linguagem.length > 0) {
                return _.filter(input, function(e) {
                    if(!e.terms.linguagem){
                        return false;
                    }
                    var has = false;
                    e.terms.linguagem.forEach(function(l){
                        if(linguagem.indexOf(l) >= 0){
                            has = true;
                        }
                    });
                    return has;
                });
            }
            return input;
        }
    }
])

.filter('spaceEvents', [
    'EventService',
    function(Event) {
        return function(input, space) {
            if(space && space.id) {
                return _.filter(input, function(e) {
                    var occurrences = _.filter(e.occurrences, function(occur) {
                        var occurSpace = Event.getOccurrenceSpace(occur);
                        if(occurSpace && occurSpace.id == space.id) {
                            return true;
                        }
                        return false;
                    });
                    return occurrences.length;
                });
            }
            return input;
        }
    }
])

.filter('spaceOccurrences', [
    'EventService',
    function(Event) {
        return function(input, space) {
            if(space && space.id) {
                return _.filter(input, function(occur) {
                    var occurSpace = Event.getOccurrenceSpace(occur);
                    if(occurSpace && occurSpace.id == space.id) {
                        return true;
                    }
                    return false;
                });
            }
            return input;
        }
    }
])

.filter('futureEvents', [
    'EventService',
    function(Event) {
        return function(input, future) {
            if(future) {
                var now = Event.getToday().unix();
                return _.filter(input, function(e) {
                    if(e.occurrences[e.occurrences.length-1].timestamp > now) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }
            return input;
        };
    }
])

.filter('futureOccurrences', [
    'EventService',
    function(Event) {
        var now = Event.getToday().unix();
        return function(input, future) {
            if(future) {
                return _.sortBy(_.filter(input, function(occurrence) {
                    return occurrence.timestamp > now;
                }), function(occur) { return occur.timestamp; });
            }
            return _.sortBy(input, function(occur) { return occur.timestamp; });
        };
    }
])

.filter('byDateEvents', [
    'EventService',
    function(Event) {
        return function(input, from, to) {
            if(from) {
                to = to || from;
                from = moment(from).unix();
                to = moment(to).add('days', 1).unix();
                return _.filter(input, function(e) {
                    var occurrences = _.filter(e.occurrences, function(occur) {
                        return occur.timestamp <= to && occur.timestamp >= from;
                    });
                    return occurrences.length;
                });
            } else {
                return input;
            }
        }
    }
])

.filter('byDateOccurrences', [
    'EventService',
    function(Event) {
        return function(input, from, to) {
            if(from) {
                to = to || from;
                from = moment(from).unix();
                to = moment(to).add('days', 1).unix();
                return _.filter(input, function(occur) {
                    return occur.timestamp <= to && occur.timestamp >= from;
                });
            } else {
                return input;
            }
        }
    }
])

.filter('occurrenceOrder', [
    'EventService',
    function(Event) {
        
        var today = Event.getToday().unix();

        return function(input) {

            input = _.sortBy(input, function(occur) {
                if(!occur.isFuture)
                    return occur.timestamp*2;
                else
                    return occur.timestamp;
            });

            return input;

        }
    }
]);