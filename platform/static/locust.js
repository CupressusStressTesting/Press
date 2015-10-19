$(document).ready(function() {
    if($("#locust_count").length > 0) {
        $("#locust_count").focus().select();
    }

    var socket = io('http://127.0.0.1:3000/');

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

$(".close_link").click(function(event) {
    event.preventDefault();
    $(this).parent().parent().hide();
});

$("ul.tabs").tabs("div.panes > div");

var stats_tpl = $('#stats-template');
var errors_tpl = $('#errors-template');
var exceptions_tpl = $('#exceptions-template');

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
}

// Sorting by column
var sortAttribute = "name";
var desc = false;
var report;
$(".stats_label").click(function(event) {
    event.preventDefault();
    sortAttribute = $(this).attr("data-sortkey");
    desc = !desc;

    $('#stats tbody').empty();
    $('#errors tbody').empty();
    totalRow = report.stats.pop()
    sortedStats = (report.stats).sort(sortBy(sortAttribute, desc))
    sortedStats.push(totalRow)
    $('#stats tbody').jqoteapp(stats_tpl, sortedStats);
    $('#errors tbody').jqoteapp(errors_tpl, (report.errors).sort(sortBy(sortAttribute, desc)));
});

function updateStats() {
    $.get('/stats/requests', function (data) {
        report = JSON.parse(data);
        $("#total_rps").html(Math.round(report.total_rps*100)/100);
        //$("#fail_ratio").html(Math.round(report.fail_ratio*10000)/100);
        $("#fail_ratio").html(Math.round(report.fail_ratio*100));
        $("#status_text").html(report.state);
        $("#js-user-count").html(report.user_count);

        if (report.slave_count)
            $("#slaveCount").html(report.slave_count)

        $('#stats tbody').empty();
        $('#errors tbody').empty();

        totalRow = report.stats.pop()
        sortedStats = (report.stats).sort(sortBy(sortAttribute, desc))
        sortedStats.push(totalRow)
        $('#stats tbody').jqoteapp(stats_tpl, sortedStats);

        $('#errors tbody').jqoteapp(errors_tpl, (report.errors).sort(sortBy(sortAttribute, desc)));
        setTimeout(updateStats, 2000);
    });
}
updateStats();

function updateExceptions() {
    $.get('/exceptions', function (data) {
        $('#exceptions tbody').empty();
        $('#exceptions tbody').jqoteapp(exceptions_tpl, data.exceptions);
        setTimeout(updateExceptions, 5000);
    });
}
updateExceptions();