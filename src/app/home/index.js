'use strict';


angular.module('mci.home', [
    'mci.news',
    'mci.events'
])
.config([
    '$stateProvider',
    function($stateProvider) {

        $stateProvider
            .state('home', {
                url: '/',
                controller: 'HomeController',
                templateUrl: BASE_URI + 'views/pages/home.html',
                resolve: {
                    NewsData: [
                        '$q',
                        '$window',
                        'NewsService',
                        function($q, $window, News) {

                            if($window.mci.config.wpUrl) {
                                return News.get(4);
                            } else {
                                return false;
                            }

                        }
                    ]
                }
            });

    }
])
.controller('HomeController', [
    'NewsData',
    'EventService',
    '$scope',
    function(NewsData, Event, $scope) {

        if(NewsData) {
            $scope.news = {
                first: NewsData.data[0],
                second: NewsData.data[1]
            };
        }

        $scope.isFutureEvents = true;
        $scope.homeEvents = Event.getFutureEvents(5);

        $scope.allEvents = Event.getEvents();
        $scope.allSpaces = Event.getSpaces();



        $scope.metaservice.set('title', 'Mês da Cultura Independente');
        $scope.metaservice.set('description', $scope.allEvents.length + ' atrações em ' +
                                              $scope.allSpaces.length + ' lugares!');
        $scope.metaservice.set('image', null);
        $scope.metaservice.set('url', null);
    }
]);