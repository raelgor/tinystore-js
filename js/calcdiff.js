setTimeout(function () {
    
    if(!$('.item-content-wrapper .old-price span:first-child').html()) return;
    
    var oldPrice = +$('.item-content-wrapper .old-price span:first-child').html().trim() || NaN;
    var newPrice = +$('.item-content-wrapper .new-price span:nth-child(2)').html().trim() || NaN;

    if (oldPrice && newPrice && oldPrice !== newPrice) {

        var pc = -(Math.floor(newPrice / oldPrice * 100) - 100);
        var dif = String(Math.round((oldPrice - newPrice) * 100) / 100);

        $('.item-content-wrapper .new-price').after('<div class="diff">Κερδίζετε ' + dif + '&euro; (-' + pc + '%)</div>')

        $('.diff').css({
            'text-align': 'center',
            'font-weight': 'bold',
            'color': 'red',
            'margin-top': '8px'
        });

    }

},200); 