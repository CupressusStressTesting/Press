(function () {
    var socket = io();

    socket.on('connected', console.log);

    var Service = {
        getRequestStatistic: function (success) {
            socket.on('request.statistic.update', success);
        },
        setSetting: function (data) {
            socket.emit('setting.set', data);
        },
        stop: function () {
            socket.emit('process.stop');
        }
    };

    $(document).ready(function () {
        $("#locust_count").focus();
    });

    $('#js-stop').click(function (event) {
        Service.stop();

        function success() {
            $('body').attr('class', 'stopped');
            $('.box_stop').hide();
            $('#js-new-test').show();
            $('.user_count').hide();
        }

        success();
    });

    $('#js-reset a').click(function (event) {
        event.preventDefault();
        /* TODO */
    });

    $("#js-new-test").click(function (event) {
        event.preventDefault();
        $("#start").show();
        $("#locust_count").focus();
    });

    $(".edit_test").click(function (event) {
        event.preventDefault();
        $("#edit").show();
        $("#new_locust_count").focus();
    });

    $('.close_link').click(function (event) {
        $(this).parent().parent().hide();
    });

    $('ul.tabs').tabs('div.panes > div');

    var statisticTemplate = _.template($('#js-template-stats').html());

    var useFormSetting = function (form) {
        var data = {};
        var serializeArray = $(form).serializeArray();
        for (var index in serializeArray) {
            data[serializeArray[index].name] = serializeArray[index].value;
        }
        Service.setSetting(data);
    };

    $('#js-swarm-form').submit(function (event) {
        event.preventDefault();

        useFormSetting(this);

        function success() {
            $('body').attr('class', 'hatching');
            $('#start').fadeOut();
            $('#status').fadeIn();
            $('.box_running').fadeIn();
            $('#js-new-test').fadeOut();
            $('.user_count').fadeIn();
        }

        success();
    });

    $('#js-edit-form').submit(function (event) {
        event.preventDefault();

        useFormSetting(this);

        function success() {
            $('body').attr('class', 'hatching');
            $('#edit').fadeOut();
        }

        success();
    });

    var sortBy = function (field, reverse) {
        reverse = (reverse) ? -1 : 1;
        return function (a, b) {
            a = a[field];
            b = b[field];
            if (a < b) return reverse * -1;
            if (a > b) return reverse * 1;
            return 0;
        }
    };

    // Sorting by column
    var sortAttribute = "name";
    var desc = false;
    var report;

    function show(report) {
        $('#js-statistic')
            .empty()
            .html(statisticTemplate({
                list: getSortedStats(report.stats)
            }));
    }

    function getSortedStats(list) {
        if (list.length) {
            var sortCallback = sortBy(sortAttribute, desc);
            var total = list.pop();
            list.sort(sortCallback);
            list.push(total);
        }

        return list;
    }

    $('.stats_label').click(function (event) {
        sortAttribute = $(this).attr("data-sortkey");
        desc = !desc;

        show(report);
    });

    function updateStats() {
        Service.getRequestStatistic(function (data) {
            report = data;
            $("#total_rps").html(Math.round(report.total_rps * 100) / 100);
            //$("#fail_ratio").html(Math.round(report.fail_ratio*10000)/100);
            $("#fail_ratio").html(Math.round(report.fail_ratio * 100));
            $("#js-current-status").html(report.state);
            $("#js-user-count").html(report.user_count);

            show(report);
        });
    }

    updateStats();
})();