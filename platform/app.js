var express = require('express');
var app = express();
var request = require('request');

app.use(express.static('public'));
app.use(express.static('static'));

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)
});

var io = require('socket.io')(server);
io.sockets.on('connection', function (socket) {

    socket.emit('connected', {
        message: 'Platform Side'
    });

    socket.on('setting.set', function (data) {
        StressTestingCore.setSetting(data.user_count, data.hatch_rate);
        StressTestingCore.setState('running');
    });

    socket.on('process.stop', StressTestingCore.stop);

    setInterval(function () {
        socket.emit('request.statistic.update', StressTestingCore.getRequestStatistic());
    }, 1000);

});

var StressTestingCore = (function () {
    var setting = {
        userCount: 0,
        hatchRate: 0
    };

    var processes = {
        state: 'ready',
        host: 'https://github.com/',
        statistic: {
            data: {},
            add: function (url, microtime, success, length) {
                if (this.data[url]) {
                    var current = this.data[url];
                    current["count"] += 1;
                    current["success_count"] += success;
                    current["time"] += microtime;

                    current["min_response_time"] = Math.min(current["min_response_time"], microtime);
                    current["max_response_time"] = Math.max(current["max_response_time"], microtime);

                    current["avg_content_length"] = length;
                } else {
                    this.data[url] = {
                        "name": url,
                        "success_count": 0 + success,

                        "min_response_time": microtime,
                        "max_response_time": microtime,

                        "avg_content_length": length,
                        "method": "GET",
                        "count": 1,
                        "time": microtime
                    }
                }
            },
            toArray: function () {
                var data = [];
                for (var url in this.data) {
                    var item = this.data[url];
                    data.push({
                        "name": item["name"],
                        "method": item["method"],

                        "min_response_time": item["min_response_time"],
                        "max_response_time": item["max_response_time"],
                        "median_response_time": (item["min_response_time"] + item["max_response_time"]) / 2,

                        "current_rps": item["count"] * 1000 / item["time"],

                        "num_failures": item["count"] - item["success_count"],

                        "avg_content_length": item["avg_content_length"],
                        "avg_response_time": item["time"] / (item["count"] * 1000),
                        "num_requests": item["count"]
                    });
                }

                if (data.length > 1) {
                    var first = data[0];
                    var total = {
                        "name": "Total",
                        "method": "Any",

                        "min_response_time": first["min_response_time"],
                        "max_response_time": first["max_response_time"],
                        "median_response_time": 0,

                        "current_rps": 0,
                        "num_failures": 0,

                        "avg_content_length": 0,
                        "avg_response_time": 0,
                        "num_requests": 0
                    };

                    var avgContentLength = 0,
                        avgContentTime = 0;


                    for (var index in data) {
                        var item = data[index];
                        total["min_response_time"] = Math.min(
                            total["min_response_time"],
                            item["min_response_time"]
                        );

                        total["max_response_time"] = Math.max(
                            total["max_response_time"],
                            item["max_response_time"]
                        );

                        total["num_failures"] += item["num_failures"];
                        total["current_rps"] += item["current_rps"];

                        total["num_requests"] += item["num_requests"];

                        avgContentLength += item["avg_content_length"];
                        avgContentTime += item["avg_response_time"];

                    }

                    total["median_response_time"] = (total["min_response_time"] + total["max_response_time"]) / 2;
                    total["avg_content_length"] = avgContentLength / data.length;
                    total["avg_response_time"] = avgContentTime / data.length;

                    data.push(total);
                }

                return data;
            }
        },
        add: function (path) {
            var begin = Date.now();
            request(this.host + path, function (error, response, body) {
                var time = Date.now() - begin;
                processes.statistic.add(path, time, response.statusCode === 200, body.length)
            })
        },
        map: {},
        push: function (item) {
            var path = item.path,
                count = item.count;
            clearInterval(this.map[path]);
            this.map[path] = setInterval(function () {
                for (var i = 0; i < count; ++i) {
                    processes.add(path);
                }
            }, item.interval);
        },
        start: function (settings) {
            var host = settings.host;

            for (var index in settings.list) {
                this.push(settings.list[index]);
            }
        },
        stop: function () {
            for (var path in this.map) {
                clearInterval(this.map[path]);
            }
        },
        getStatistic: function () {
            return processes.statistic.toArray();
        }
    };

    var getUrlList = function () {
        return {
            list: [
                {
                    path: 'ReenExe',
                    interval: 300,
                    count: 10
                },
                {
                    path: 'Golars',
                    interval: 500,
                    count: 10
                }
            ]
        };
    };

    return {
        setSetting: function (userCount, hatchRate) {
            setting.userCount = userCount;
            setting.hatchRate = hatchRate;
            processes.start(getUrlList());
        },

        setState: function (state) {
            processes.state = state;
        },

        stop: function () {
            processes.state = 'stop';
            processes.stop();
        },

        getRequestStatistic: function () {
            var stats = processes.getStatistic();

            var rps = 0,
                fail = 0;
            if (stats.length) {
                var total = stats[stats.length - 1];
                rps = total["current_rps"];
                fail = total["num_failures"] / total["num_requests"];
            }

            return {
                "stats": stats,
                "state": processes.state,
                "total_rps": rps,
                "fail_ratio": fail,
                "user_count": setting.userCount
            };
        }
    }
})();