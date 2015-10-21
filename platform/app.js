var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('static'));

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)
});

var io = require('socket.io')(server);
io.sockets.on('connection', function(socket) {

    socket.emit('connected', {
        message: 'Platform Side'
    });

    socket.on('setting.set', function(data) {
        StressTestingCore.setSetting(data.user_count, data.hatch_rate);
    });

    setInterval(function () {
        socket.emit('request.statistic.update', StressTestingCore.getRequestStatistic());
    }, 1000);

});

var StressTestingCore = (function () {
    var setting = {
        userCount: 0,
        hatchRate: 0
    };

    return {
        setSetting: function (userCount, hatchRate) {
            setting.userCount = userCount;
            setting.hatchRate = hatchRate;
        },

        getRequestStatistic: function () {
            return {
                "stats": [{
                    "median_response_time": 5,
                    "min_response_time": 5,
                    "current_rps": 0.0,
                    "name": "/api/collections",
                    "num_failures": 0,
                    "max_response_time": 5,
                    "avg_content_length": 177,
                    "avg_response_time": 5.0,
                    "method": "GET",
                    "num_requests": 1
                }, {
                    "median_response_time": 4,
                    "min_response_time": 0,
                    "current_rps": 0.0,
                    "name": "Total",
                    "num_failures": 0,
                    "max_response_time": 5,
                    "avg_content_length": 100,
                    "avg_response_time": 4.5,
                    "method": null,
                    "num_requests": 2
                }],
                "state": "running",
                "total_rps": Math.floor(Math.random() * 10),
                "fail_ratio": Math.floor(Math.random() * 3),
                "user_count": setting.userCount
            };
        }
    }
})();