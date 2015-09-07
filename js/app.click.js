$(window).click(function (e) {

    var tar = $(e.target);

    if (tar.is('.fixed-windows')) tar.addClass('out');

    if (tar.is('.product .price-wrapper .add-to-cart, .add-to-cart-btn, .add-to-cart-btn *')) {

        addToCart(tar.parents('.product, .item-content-wrapper'));
        e.preventDefault();
        e.stopPropagation();
        return false;

    }

});

function addToCart(productElement) {

    var price;
    if (productElement.is('.item-content-wrapper')) price = +productElement.find('.new-price span:nth-child(2)').html().trim();
    else price = +productElement.find('.final-price span:first-child').html().trim();

    var product = {

        bnid: productElement.attr('data-bnid'),
        price: price,
        quantity: 1

    }

    lists.add('cart', product);

}

window.lists = {

    _cart: {},
    _wishlist: {},

    add: function (list, product) {

        if (product.bnid in this['_' + list]) return;

        this['_' + list][product.bnid] = product;

        this.save();

    },

    get toString() {

        return JSON.stringify({

            cart: this._cart,
            wl: this._wl

        });

    },

    updateCartPrice: function(){
    
        $('.cart-text').html('Καλάθι (' + this.length + ')');
        $('.cart-checkout').html(this.price + ' &euro;');

    },

    remove: function (list, bnid) {

        delete this['_' + list][bnid];
        this.save();

    },

    getBnids: function (list) {

        return Object.keys(this['_' + list]);

    },

    save: function () {

        this.updateCartPrice();

        localStorage.setItem('cartData', JSON.stringify(this._cart));
        localStorage.setItem('wlData', JSON.stringify(this._wishlist));

        $.post('/api/updatelists', {

            lists: this.toString,
            csrf: _userData.csrf

        });

    },

    get price() {

        var price = 0;
        for (var bnid in this._cart) price += +this._cart[bnid].price * this._cart[bnid].quantity;

        if (_userData && _userData.shippingMinimum && price < _userData.shippingMinimum) price += _userData.shippingCost || 0;

        price = String(price).split('.').length ? String(price).split('.')[0] + '.' + String(price).split('.')[1].substr(0, 2) : String(price);

        return price.split('.')[1] && price.split('.')[1].length < 2 ? price + '0' : price;


    },

    get length() {

        var length = 0;

        for (var bnid in this._cart) length += this._cart[bnid].quantity;

        return length;

    }

}

window.tmp = ['cart', 'wl'];

tmp.forEach(function (s) {

    var tmp = localStorage.getItem(s + 'Data');

    s = s == 'wl' ? 'wishlist' : s;

    try {

        tmp = JSON.parse(tmp);

    } catch (err) { }

    if (tmp && typeof tmp == 'object') lists['_' + s] = tmp;

});

setTimeout(function () {

    lists.updateCartPrice();

}, 0);