window.toast = function (message) {

    $('.toast').addClass('retired');

    var toast = $('<div>').addClass('toast ani04').html('<span>x</span>' + message);

    $('body').append(toast);

    setTimeout(function () { toast.addClass('born'); },0);
    setTimeout(function () { toast.addClass('retired'); }, 8000);

}

// Collect garbage
setInterval(function () { $('.retired').remove(); }, 10000);