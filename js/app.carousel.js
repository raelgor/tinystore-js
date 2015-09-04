app.onstart.push(function () {

    if (!$('.banner').length) return;

    var tar = $('.banner-list :first');

    setInterval(function () {

        if (tar.next().length) tar = tar.next();
        else tar = $('.banner-list :first');

        $('.banner').append('<img class="ani04" src="' + tar.attr('src') + '">')
                    .attr('href', tar.attr('data-links-to'));


        var ani = $('.banner img:nth-child(2)').css({ 
            'position': 'relative', 
            'top': '-' + $('.banner img:first').height() + 'px',
            'opacity': 0
        });

        setTimeout(function () { ani.animate({ 'opacity': 1  }, 200, 'swing'); },0);

        setTimeout(function () {
            $('.banner :first-child').remove();
            $('.banner :first-child').css('position', 'static');
        }, 600);

    }, 6000);

});