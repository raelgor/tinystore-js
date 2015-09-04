window.onresize = app.onresize = function (e) {

    if($('.banner').length) $('.banner').css('height', $('.banner').width()*325/720 + 'px')

}