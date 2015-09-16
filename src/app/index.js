'use strict';

require('./helpers');

/*
 * Modules
 */

require('./home');
require('./events');
require('./news');
require('./social');

require('./facebook');

/*
 * App
 */

angular.module('mci', [
    'ui.router',
    'FacebookPluginDirectives',
    'mci.home',
    'mci.events',
    'mci.news',
    'mci.social'
])

.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    '$httpProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');

        $stateProvider
            .state('about', {
                url: '/sobre/',
                templateUrl: BASE_URI + 'views/pages/about.html'
            })
            .state('press', {
                url: '/imprensa/',
                templateUrl: BASE_URI + 'views/pages/press.html'
            });

        /*
         * Trailing slash rule
         */
        $urlRouterProvider.rule(function($injector, $location) {
            var path = $location.path(),
                search = $location.search(),
                params;

            // check to see if the path already ends in '/'
            if (path[path.length - 1] === '/') {
                return;
            }

            // If there was no search string / query params, return with a `/`
            if (Object.keys(search).length === 0) {
                return path + '/';
            }

            // Otherwise build the search string and return a `/?` prefix
            params = [];
            angular.forEach(search, function(v, k){
                params.push(k + '=' + v);
            });
            
            return path + '/?' + params.join('&');
        });

    }
])

/* 
 * Track history and push navigation to Google Analytics
 */
.run([
    '$rootScope',
    '$location',
    '$window',
    function($rootScope, $location, $window) {

        /*
         * Store nav history
         */
        $window.mci.history = [];
        $rootScope.$on('$stateChangeSuccess', function() {

            if($window._gaq) {
                $window._gaq.push(['_trackPageview', $location.path()]);
            }
            $window.mci.history.push($window.location.pathname);

        });

    }
])

.filter('offset', function() {
    return function(input, start) {
        start = parseInt(start, 10);
        return input.slice(start);
    };
})

.directive('fromnow', [
    '$interval',
    function($interval) {
        return {
            scope: {
                date: '=date'
            },
            template: '{{fromNow}}',
            link: function(scope, element, attrs) {

                var today = moment();

                var date = moment(scope.date*1000);

                scope.fromNow = date.from(today);
                var interval = $interval(function() {
                    scope.fromNow = date.from(today);
                }, 1000*60);

                scope.$watch('date', function() {
                    date = moment(scope.date*1000);
                    scope.fromNow = date.from(today);
                    $interval.cancel(interval);
                    interval = $interval(function() {
                        scope.fromNow = date.from(today);
                    }, 1000*60);
                });
            }
        }
    }
])

.controller('NavCtrl', [
    '$scope',
    '$sce',
    function($scope, $sce) {

        $scope.nav = [
            {
                title: 'Página inicial',
                href: BASE_URI,
                icon: $sce.trustAsHtml('&#8962;')
            },
            {
                title: 'Agenda',
                href: BASE_URI + 'agenda/',
                icon: $sce.trustAsHtml('&#128197;')
            },
            {
                title: 'Notícias',
                href: BASE_URI + 'noticias/',
                icon: $sce.trustAsHtml('&#128196;')
            },
            {
                title: 'Na rede',
                href: BASE_URI + 'na-rede/',
                icon: $sce.trustAsHtml('&#127748;')
            },
            {
                title: 'Imprensa',
                href: BASE_URI + 'imprensa/',
                icon: $sce.trustAsHtml('&#127908;')
            },
            {
                title: 'Sobre',
                href: BASE_URI + 'sobre/',
                icon: $sce.trustAsHtml('&#8505;')
            }
        ];

        $scope.updateHover = function(str) {

            $scope.currentHover = str;

        };

        $scope.currentHover = '';

    }
])

.controller('MainCtrl',['$scope', '$rootScope', 'MetaService',
function($scope, $rootScope, MetaService){
    $rootScope.metaservice = MetaService;
}])
/*
 * Loading module
 */

.config([
    '$httpProvider',
    function($httpProvider) {
        $httpProvider.interceptors.push('loadingStatusInterceptor');
    }
])

.service('LoadingService', [
    function() {

        var loads = [];

        return {
            get: function() {
                return loads;
            },
            add: function(text, id) {
                if(typeof id == 'undefined')
                    id = Math.random();

                var load = {
                    _id: id,
                    msg: text
                };

                loads.push(load);
                loads = loads; // trigger digest?
                return load._id;
            },
            remove: function(id) {
                loads = loads.filter(function(load) { return load._id !== id; });
                loads = loads;
                return loads;
            }
        }

    }
])

.service('MetaService', function() {
    var title = 'Test';
    var metaDescription = '';
    var metaKeywords = '';
    var metaUrl = '';
    var metaImage = '';
    return {
        set: function(newTitle, newMetaDescription, newKeywords, newUrl, newImage) {
            title = newTitle; 
            metaDescription = newMetaDescription;
            metaKeywords = newKeywords;
            metaUrl = newUrl;
            metaImage = newImage;
        },
        metaTitle: function(){
            var def = 'Cultura Independente';
            return title ? def + ' | ' + title : def;
        },
        metaDescription: function() {
            return metaDescription || 'Shows, exposições, histórias em quadrinhos, literatura e cinema';
        },
        metaKeywords: function() {
            return metaKeywords || 'mci, shows, exposições, quadrinhos, literatura, cinema';
        },
        metaUrl: function() {
            return metaUrl || document.location.href;
        },
        metaImage: function() {
            var def = 'http://' + document.location.hostname + BASE_URI + 'img/logo.png';
            return metaImage || def;
        }
    };
})

.directive('loadingStatusMessage', [
    'LoadingService',
    function(service) {
        return {
            link: function($scope, $element, attrs) {
                $scope.$watch(function() {
                    return service.get();
                }, function(loads) {
                    $scope.loads = loads;
                });
            },
            template: '<div class="loading-message"><span ng-repeat="load in loads" ng-show="load.msg">{{load.msg}}<br/></span></div>'
        };
    }
])

.directive('mciFbLike', ['$timeout', function($timeout){
    return {
        'restrict': 'E',
        'scope':{
            'href': '=',
        },
        'template': '<a data-layout="standard"'         +
                      ' data-action="like"'             +
                      ' data-show-faces="false"'        +
                      ' data-share="true"'              +
                      ' data-width="200"'               +
                      ' ng-if="href"'                   +
                      ' ng-class="{\'fb-like\': href}"' +
                      ' data-href="{{href}}">like</a>',
        'link': function(scope, element, attrs) {
            $timeout(function(){
                if(window.FB && FB.XFBML && FB.XFBML.parse) {
                    FB.XFBML.parse();
                }
            });
        }
    };
}])

.directive('mciEvent', ['$timeout',  function($timeout) {
    return {
        'restrict': 'A',
        'scope':{
            'evt': '=mciEvent',
        },
        'link': function(scope, element, attrs) {
            var baseUrl = document.baseURI + 'agenda/';
            scope.ld = [];

            var occurrences = scope.evt.occurrences;
            for(var i=0; occurrences && i < occurrences.length; i++){
                var occ = occurrences[i];
                var ld = {
                  "@context": "http://schema.org",
                  "@type": "Event",
                  "name": scope.evt.name,
                  "startDate" : occ.moment.format(),
                  "url" : baseUrl + scope.evt.id,
                  "location" : {
                    "@type" : "Place",
                    "name" : occ.space.name,
                    "address" : occ.space.endereco,
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": occ.space.location.latitude,
                        "longitude": occ.space.location.longitude
                    }
                  },
                  "offers" : {
                    "@type" : "AggregateOffer",
                    "category" : "primary",
                    "priceCurrency": "BRL",
                    "lowPrice" : (occ.price || '').replace(/[^0-9,.]/g, '') || '0',
                    "url" : baseUrl + scope.evt.id
                  }
                };

                if(scope.evt['@files:header'] && scope.evt['@files:header'].url) {
                    ld.image = scope.evt['@files:header'].url;
                }

                scope.ld.push(ld);
            }
            if (element.context) {
                element.context.innerHTML = angular.toJson(scope.ld);
            }
        }
    };
}])

.factory('loadingStatusInterceptor', [
    '$q',
    '$rootScope',
    '$timeout',
    'LoadingService',
    function($q, $rootScope, $timeout, service) {
        return {
            request: function(config) {

                if(config.loadingMessage)
                    config.loadingId = service.add(config.loadingMessage);

                return config || $q.when(config);
            },
            response: function(response) {

                if(response.config.loadingId)
                    service.remove(response.config.loadingId);

                return response || $q.when(response);
            },
            responseError: function(rejection) {


                if(rejection.config.loadingId)
                    service.remove(rejection.config.loadingId);

                return $q.reject(rejection);
            }
        };
    }
]);

$(document).ready(function() {
    var baseUri = $('head base').attr('href');
    angular.module('mci').constant('BASE_URI', baseUri);

    $('#loading').addClass('active');
    $.get(baseUri + 'api/data', function(data) {
        window.mci = data;
        $('#loading').removeClass('active');
        angular.bootstrap(document, ['mci']);
    }, 'json');
});