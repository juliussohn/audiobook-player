var app = angular.module('app', ['youtube-embed', 'ui.router', 'hoodie']);
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/listen");
    $stateProvider
        .state('index', {
            url: "/",
            templateUrl: "partials/index.html",
            controller: function ($state, $rootScope, $q, $scope, User) {
                var promiseQueue = User.getQueue()
                    .then(function (queue) {

                            $rootScope.queue = queue;
                            console.log(queue)
                        },
                        function (err) {
                            console.log(err);
                        });
                var promiseSettings = User.getPlayerSettings()
                    .then(function (settings) {
                        $rootScope.settings = settings;
                        console.log(settings)
                    }, function (err) {
                        console.log(err);
                    });
                $q.all([promiseQueue, promiseSettings])
                    .then(function () {
                        if ($rootScope.queue.length > 0) {
                            $state.go("player");
                        }
                        else {
                            $state.go("create");
                        }
                        console.log($rootScope.queue, $rootScope.settings);
                    }, function (err) {
                        console.log(err);
                    });
            }
        })
        .state('player', {
            url: "/listen",
            templateUrl: 'partials/player.html',
            controller: "PlayerController"
               
        })
        .state('create', {
            url: "/create",
            templateUrl: "partials/create.html",
            controller: "CreateController"
        });
});
app.run(function ($rootScope) {
    $rootScope.queue = [];
});
app.controller('CreateController', function ($scope, Video, User, $rootScope, $state) {
    $scope.$watch('youtubeUrl', function (newUrl, oldUrl) {
        $scope.invalidUrl = false;
        if (newUrl == "" || newUrl === undefined) {
            $scope.isChecking = false;
        }
        else {
            $scope.isChecking = true;
            Video.getData(newUrl)
                .then(function (data) {
                    console.log(data);
                    User.addToQueue(data)
                        .then(
                            function (result) {
                                $rootScope.queue.push(result);
                                $state.go("player");
                            },
                            function (error) {
                                console.log(err);
                            }
                        );
                }, function (error) {
                    $scope.isChecking = false;
                    $scope.invalidUrl = true;
                });
        }
    });
});
app.controller('PlayerController', function ($scope, $rootScope, $state, User, $interval, Video) {
    
    $scope.darkenDelay = 20;
//redirect to start if no videos are queed
    
    $scope.getIndexById=function(id){
        for (var i = $rootScope.queue.length - 1; i >= 0; i--) {
            if ($rootScope.queue[i].id == id) {
                return i;
            }
        }
    }
   
    if ($rootScope.queue.length < 1 || !$rootScope.settings) {
        $state.go("index");

    }
    else {
        $scope.currentTime = $rootScope.settings.stoppedTime;
        //search for index with id  $rootScope.settings.stoppedIndex
        $scope.currentIndex = 0;
        if($rootScope.settings.stoppedIndex){
            $scope.currentIndex = $scope.getIndexById($rootScope.settings.stoppedIndex);
        }
        
        
        $rootScope.playingId = $rootScope.queue[$scope.currentIndex].yt_id;
    }
    $scope.$on('youtube.player.ready', function ($event, player) {

        $scope.playerReady = true;
         $scope.setSleepTimer();
        
        $scope.saveCurrentIndex();
        $rootScope.playerDuration = player.getDuration();
        var seekTo = $scope.currentTime;
        if ($scope.videoChanged) seekTo = 0;
        player.seekTo(seekTo);
        if (angular.isDefined($scope.playerInterval)) return;
        $scope.playerInterval = $interval(function () {
            $scope.playerPercent = $scope.getPercent()
        }, 100);
    });
    $scope.$on('youtube.player.playing', function ($event, player) {
        $scope.playing = true;
        $scope.setSleepTimer();
        $scope.saveInterval = $interval(function () {
            $scope.saveCurrentTime();
        }, 1000);
    });
    $scope.$on('youtube.player.paused', function ($event, player) {
        $scope.saveCurrentTime();
        $interval.cancel($scope.saveInterval);
        $scope.playing = false;
        $scope.stopSleepTimer();
    });

     $scope.$on('youtube.player.ended', function ($event, player) {
        if ($scope.currentIndex < $rootScope.queue.length -1) {
            console.log($rootScope.queue[$scope.currentIndex + 1].id);
            $scope.playVideo( $rootScope.queue[$scope.currentIndex + 1].id);
        }else{
            $scope.pause();
        }
        
    });
    /**
     * Player Functions
     */
    $scope.playerOptions = {
        autoplay: false
    };
    
    $scope.play = function () {
        $scope.ytPlayer.playVideo()
    };
    $scope.pause = function () {
        $scope.ytPlayer.stopVideo();
    };
    $scope.playVideo = function (id) {
        $scope.playerReady = false;
        $scope.currentIndex = $scope.getIndexById(id);
        $scope.videoChanged = true;
        $rootScope.playingId = $rootScope.queue[$scope.currentIndex].yt_id;
        
    };
    $scope.getPercent = function () {
        if ($scope.playerReady === true) {
            return ($scope.ytPlayer.getCurrentTime() / $rootScope.playerDuration) * 100;
        }else{
            return 0;
        }
    };
    $scope.searchTo = function (event) {
        var width = event.target.offsetWidth;
        var offset = event.offsetX;
        var percent = (offset / width);
        $scope.searchToPercent = percent * 100;
        $scope.searchToTime = percent * $rootScope.playerDuration;
    };
    $scope.jumpTo = function (event) {
        $scope.currentTime = $scope.searchToTime;
        $scope.ytPlayer.seekTo($scope.currentTime);
    };
    $scope.saveCurrentTime = function () {
        if ($scope.playerReady === true) {
            User.setSetting("stoppedTime", $scope.ytPlayer.getCurrentTime());
        }
    };
    $scope.saveCurrentIndex = function () {
        User.setSetting("stoppedIndex", $rootScope.queue[$scope.currentIndex].id);
    };

$scope.$watch('videoUrl', function (newUrl, oldUrl) {
        $scope.invalidUrl = false;
        if (newUrl == "" || newUrl === undefined) {
            $scope.isChecking = false;
        }
        else {
            $scope.isChecking = true;
            Video.getData(newUrl)
                .then(function (data) {
                   
                    $scope.queue();
                }, function (error) {
                    $scope.isChecking = false;
                    $scope.invalidUrl = true;
                });
        }
    });

    $scope.queue = function () {
            var videoDataPromise = Video.getData($scope.videoUrl);
            videoDataPromise.then(
                function (videoData) {
                    User.addToQueue(videoData)
                        .then(function (video) {
                            $rootScope.queue.push(video);
                            $scope.videoUrl="";
                        });
                });
        }
        /**
         * Queue Functions
         */
    $scope.removeFromQueue = function (id) {
        User.removeFromQueue(id)
            .then(function (data) {
                $rootScope.queue = data;
            });
    };
    /**
     * Sleep functions
     */
    
     $scope.setSleepTime = function (time) {
        $rootScope.settings.sleepTime = time;
        User.setSetting("sleepTime", time)
            .then(
                function (settings) {
                    $rootScope.settings = settings;
                    $scope.resetSleepTimer();
                },
                function (error) {
                    console.log(error)
                });
    };

     $scope.setSleepTimer = function () {
        $scope.resetSleepTimer();
        if (angular.isDefined($scope.sleepInterval)) return;
        $scope.sleepInterval = $interval(function () {
            $scope.sleepTimer--;
            if( ($rootScope.settings.sleepTime*60 - $scope.sleepTimer) > $scope.darkenDelay ){
                $scope.darken = true;
            }
            if ($scope.sleepTimer == 0) {
                $scope.stopSleepTimer();
                $scope.ytPlayer.stopVideo();
            }
        }, 1000);
    };

   
     $scope.resetSleepTimer = function () {
        $scope.darken = false;
        $scope.sleepTimer = $rootScope.settings.sleepTime * 60;
    };
    $scope.notAsleep = function () {
        if ($scope.playing == true) {
            $scope.ytPlayer.playVideo();
            $scope.resetSleepTimer();
        }
    };
    $scope.stopSleepTimer = function () {
        $scope.resetSleepTimer();
        if (angular.isDefined($scope.sleepInterval)) {
            $interval.cancel($scope.sleepInterval);
            $scope.sleepInterval = undefined;
        }
    };
});