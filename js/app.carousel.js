app.onstart.push(function () {

    if (!$('.banner').length) return;

    var tar = $('.banner-list :first');

    // Time between changes
    var time = 6000;

    // Timeout id
    var interval = 0;

    setTo(tar);

    $('.banner-list > *').bind("mouseover", function () { setTo($(this)); });

    $('.banner-list > *').bind("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    function next() {

        if (tar.next().length) tar = tar.next();
        else tar = $('.banner-list :first');

        setTo(tar);

    }

    function setTo(tar) {

        clearTimeout(interval);

        $('.banner').append('<img class="ani04" src="' + tar.attr('src') + '">')
                    .attr('href', tar.attr('data-links-to'));


        var ani = $('.banner img:nth-child(2)').css({
            'position': 'relative',
            'top': '-' + $('.banner img:first').height() + 'px',
            'opacity': 0
        });

        setTimeout(function () { ani.animate({ 'opacity': 1 }, 200, 'swing'); }, 0);

        setTimeout(function () {
            $('.banner :first-child').remove();
            $('.banner :first-child').css('position', 'static');
        }, 600);

        interval = setTimeout(next, time);

    }

});