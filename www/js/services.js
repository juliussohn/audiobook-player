var APIkey = "AIzaSyAjn13HAaDSb4UwkMGAPKbfS5GmhwFita8";
app.factory('User', function (hoodie, $q, $rootScope, $filter) {
    var user = {
        getQueue: function () {
            var deferred = $q.defer();
            hoodie.store.findAll('video')
                .done(function (result) {

                	var filtered = $filter('orderBy')(result, "createdAt"); 
                	console.log(filtered,result)
                    deferred.resolve(filtered);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getSettings: function () {
            var deferred = $q.defer();
            var ppomise1 = user.getStoppedAt();
            user.getStoppedAt();
            hoodie.store.findAll('settings')
                .done(function (result) {
                    deferred.resolve(result);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getPlayerSettings: function () {
            var deferred = $q.defer();
            hoodie.store.findOrAdd('settings', 'player', {
                    stoppedTime: 0,
                    stoppedIndex: 0,
                    sleepTime: 15
                })
                .done(function (result) {
                    deferred.resolve(result);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        setStoppedAt: function (time) {
            var deferred = $q.defer();
            hoodie.store.update('settings', 'player', {
                    time: time
                })
                .done(function (result) {
                    deferred.resolve(result);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },




        setSetting: function(key, value){
        	var deferred = $q.defer();
        	var data = {};
        	data[key] = value;
            hoodie.store.update('settings', 'player', data)
                .done(function (settings) {
                	deferred.resolve(settings);
                	
                    
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        
        addToQueue: function (video) {
            var deferred = $q.defer();
            video.yt_id = video.id;
            delete video.id;
            hoodie.store.add('video', video)
                .done(function (data) {
                    deferred.resolve(data);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        removeFromQueue: function (id) {
            var deferred = $q.defer();
            hoodie.store.remove('video', id)
                .done(function (data) {
                	//fetch queue again
                    user.getQueue()
                        .then(function (queue) {
                            deferred.resolve(queue);
                        }, function (error) {})
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }
    };
    return user;
});
app.factory('Video', function ($http, $q, youtubeEmbedUtils) {
    var video = {
        getData: function (url) {
            var deferred = $q.defer();
            var promise = $http.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + youtubeEmbedUtils.getIdFromURL(url) + '&key=' + APIkey)
                .then(function (data) {
                    if (data.data.pageInfo.totalResults > 0) {
                        deferred.resolve(data.data.items[0]);
                    }
                    else {
                        deferred.reject("No Videos found");
                    }
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
    };
    return video;
});