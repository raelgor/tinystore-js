window.cartPage = function () {

    var pool = $('.cart-item-list');
    var cart = _userData.cart;

    for(var bnid in cart) render(cart[bnid]);

    function render(book) {

        if (!book) return;

        var item = $('<div>');

        item.addClass('listed-cart-item')
            .html(
                '<span class="img"></span>' +
                '<span class="title"><a></a><span></span></span>' +
                '<input type="number" />' +
                '<span class="price"> &euro;</span>' +
                '<a class="remove">x</a>'
            );

        item.find('.img').css('background-image', 'url(' + book.img + ')');
        item.find('.title a').html(book.title).attr('href', book.link).attr('title', book.title);
        item.find('.title span').html('ID: ' + book.bnid);
        item.find('input').val(book.quantity);
        item.find('.price').prepend(book.price);

        item.find('.remove').click(function (e) {

            $(this).parents('.listed-cart-item').remove();
            lists.remove('cart', book.bnid);

        }).attr('title', 'Αφαίρεση από το καλάθι');

        item.find('input').change(function () {

            lists._cart[book.bnid].quantity = this.value;
            lists.save();

        });

        pool.append(item);
        
    }

}