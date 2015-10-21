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
        statistic: {
            data: {},
            add: function (url, microtime, success, length) {
                if (this.data[url]) {
                    var current = this.data[url];
                    current["num_requests"] += 1;
                } else {
                    this.data[url] = {
                        "median_response_time": microtime,
                        "min_response_time": microtime,
                        "current_rps": 0.0,
                        "name": url,
                        "num_failures": 0,
                        "max_response_time": microtime,
                        "avg_content_length": length,
                        "avg_response_time": microtime,
                        "method": "GET",
                        "num_requests": 1
                    }
                }
            },
            toArray: function () {
                var data = [];
                for (var url in this.data) {
                    data.push(this.data[url]);
                }
                return data;
            }
        },
        add: function (url) {
            var begin = Date.now();
            request(url, function (error, response, body) {
                var time = Date.now() - begin;
                processes.statistic.add(url, time, response.statusCode === 200, body.length)
            })
        },
        start: function (settings) {
            for (var index in settings) {
                var url = settings[index];
                this.add(url);
            }
        },
        getStatistic: function () {
            return processes.statistic.toArray();
        }
    };

    var getUrlList = function () {
        return [
            'https://github.com/ReenExe',
            'https://github.com/Golars'
        ];
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
            processes.state = 'stop'
        },

        getRequestStatistic: function () {
            return {
                "stats": processes.getStatistic(),
                "state": processes.state,
                "total_rps": Math.floor(Math.random() * 10),
                "fail_ratio": Math.floor(Math.random() * 3),
                "user_count": setting.userCount
            };
        }
    }
})();