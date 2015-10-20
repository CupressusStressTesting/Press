(function () {
    var Service = {
        getRequestStatistic: function (success) {
            var mock = {"errors": [], "stats": [{"median_response_time": null, "min_response_time": 0, "current_rps": 0, "name": "Total", "num_failures": 0, "max_response_time": 0, "avg_content_length": 0, "avg_response_time": 0, "method": null, "num_requests": 0}], "state": "ready", "total_rps": 0, "fail_ratio": 0.0, "user_count": 0};

            success(mock);
        },
        getExceptions: function (success) {
            var mock = {"exceptions": []};

            success(mock);
        }
    };

    $(document).ready(function() {
        if($("#locust_count").length > 0) {
            $("#locust_count").focus().select();
        }

        var socket = io();

        socket.on('connected', console.log);
    });

    $('#js-stop a').click(function(event) {
        function success() {
            $('body').attr('class', 'stopped');
            $('.box_stop').hide();
            $('#js-new-test').show();
            $('.user_count').hide();
        }

        success();
    });

    $('#js-reset a').click(function(event) {
        event.preventDefault();
        /* TODO */
    });

    $("#js-new-test").click(function(event) {
        event.preventDefault();
        $("#start").show();
        $("#locust_count").focus().select();
    });

    $(".edit_test").click(function(event) {
        event.preventDefault();
        $("#edit").show();
        $("#new_locust_count").focus().select();
    });

    $('.close_link').click(function(event) {
        $(this).parent().parent().hide();
    });

    $("ul.tabs").tabs("div.panes > div");

    var stats_tpl = $('#js-template-stats');
    var errors_tpl = $('#js-template-errors');
    var exceptions_tpl = $('#js-template-exceptions');

    $('#js-swarm-form').submit(function(event) {
        event.preventDefault();

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

    $('#js-edit-form').submit(function(event) {
        event.preventDefault();

        function success() {
            $('body').attr('class', 'hatching');
            $('#edit').fadeOut();
        }

        success();
    });

    var sortBy = function(field, reverse, primer){
        reverse = (reverse) ? -1 : 1;
        return function(a,b){
            a = a[field];
            b = b[field];
           if (typeof(primer) != 'undefined'){
               a = primer(a);
               b = primer(b);
           }
           if (a<b) return reverse * -1;
           if (a>b) return reverse * 1;
           return 0;
        }
    };

    // Sorting by column
    var sortAttribute = "name";
    var desc = false;
    var report;

    function show(report) {
        var totalRow = report.stats.pop();
        var sortedStats = report.stats.sort(sortBy(sortAttribute, desc))
        sortedStats.push(totalRow);

        $('#stats tbody')
            .empty()
            .jqoteapp(stats_tpl, sortedStats);

        $('#errors tbody')
            .empty()
            .jqoteapp(errors_tpl, report.errors.sort(sortBy(sortAttribute, desc)));
    }

    $(".stats_label").click(function(event) {
        event.preventDefault();
        sortAttribute = $(this).attr("data-sortkey");
        desc = !desc;

        show(report);
    });

    function updateStats() {
        Service.getRequestStatistic(function (data) {
            report = data;
            $("#total_rps").html(Math.round(report.total_rps*100)/100);
            //$("#fail_ratio").html(Math.round(report.fail_ratio*10000)/100);
            $("#fail_ratio").html(Math.round(report.fail_ratio*100));
            $("#status_text").html(report.state);
            $("#js-user-count").html(report.user_count);

            show(report);

            setTimeout(updateStats, 2000);
        });
    }
    updateStats();

    function updateExceptions() {
        Service.getExceptions(function (data) {
            $('#exceptions tbody').empty();
            $('#exceptions tbody').jqoteapp(exceptions_tpl, data.exceptions);
            setTimeout(updateExceptions, 5000);
        });
    }
    updateExceptions();
})();