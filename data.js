#!/usr/bin/env node

var fs = require('fs'),
	request = require('request'),
	_ = require('underscore'),
	moment = require('moment'),
	config = require('./config');

module.exports = function(cb, silent) {

	var storeDir = 'dist/data';

	var defaultReq = {
		method: 'GET'
	};

	var eventsReq = {
		url: config.apiUrl + '/event/find',
		qs: {
			'@select': 'id,name,shortDescription,description,classificacaoEtaria,terms,traducaoLibras,descricaoSonora',
			'@files': '(avatar,header):url',
			'project': 'in(@Project:' + config.projectId + ')'
		}
	};

	if(!silent)
		console.log('Baixando eventos...');

	request(_.extend(defaultReq, eventsReq), function(err, res, body) {
		if(err) {
			console.log(err);
		} else {

			var events = JSON.parse(body);
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

			if(!silent)
				console.log('Baixando ocorrências dos eventos...');

			var occursReqUrl = config.apiUrl + '/eventOccurrence/find?@select=id,eventId,rule&event=in(' + eventIds + ')&@order=_startsAt';

			request(occursReqUrl, function(err, res, body) {

				if(err) {

					console.log(err);

				} else {

					var occurrences = JSON.parse(body);

					var spaceIds = [];

					_.each(occurrences, function(occurrence) {

						var rule = occurrence.rule;

						// Store event id
						spaceIds.push(rule.spaceId);

						// Connect to event
						var event = _.find(events, function(e) { return e.id == occurrence.eventId; });
						
						event.spaceId = rule.spaceId;
						event.startsAt = rule.startsAt;
						event.startsOn = rule.startsOn;
						event.duration = rule.duration;

						event.acessibilidade = [];
						if(event.traducaoLibras)
							event.acessibilidade.push('Tradução para libras');
						if(event.descricaoSonora)
							event.acessibilidade.push('Descrição sonora');

					});

					// organize event by time of occurence

					events = _.sortBy(events, function(e) { return moment(e.startsOn + ' ' + e.startsAt, 'YYYY-MM-DD HH:mm').unix(); });

					// remove duplicates
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

					if(!silent)
						console.log('Baixando espaços das ocorrências...');

					request(_.extend(defaultReq, spacesReq), function(err, res, body) {

						if(err) {
							console.log(err);
						} else {

							var spaces = JSON.parse(body);

							fs.writeFile(storeDir + '/events.json', JSON.stringify(events), function(err) {
								if(err) {
									console.log(err);
								} else {
									if(!silent)
										console.log('Eventos atualizados');
								}
							});

							fs.writeFile(storeDir + '/occurrences.json', JSON.stringify(occurrences), function(err) {
								if(err) {
									console.log(err);
								} else {
									if(!silent)
										console.log('Ocorrências atualizadas');
								}
							});

							fs.writeFile(storeDir + '/spaces.json', JSON.stringify(spaces), function(err) {
								if(err) {
									console.log(err);
								} else {
									if(!silent)
										console.log('Espaços atualizados');
								}
							});

							if(typeof cb == 'function')
								cb();

						}

					})
				}
			});
		}
	});

};

if(!module.parent) {
	module.exports();
}