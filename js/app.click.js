$(window).click(function (e) {

    var tar = $(e.target);

    if (tar.is('.fixed-windows')) tar.addClass('out');

    if (tar.is('.product .price-wrapper .add-to-cart, .add-to-cart-btn, .add-to-cart-btn *')) {

        toast('Προστέθηκε στο καλάθι! Συνεχίστε τις αγορές σας ή κάντε <a href="/cart">checkout</a>');
        addToCart(tar.parents('.product, .item-content-wrapper'));
        e.preventDefault();
        e.stopPropagation();
        return false;

    }

    if (tar.is('.product .x')) {

        toast('Το αντικείμενο αφαιρέθηκε από το wishlist!');

        lists.remove('wishlist', tar.parents('.product').attr('data-bnid'));

        tar.parents('.product').addClass('murdered');

        e.preventDefault();
        e.stopPropagation();
        return false;

    }

    if (tar.is('.product .price-wrapper .add-to-wl, .add-to-wl-btn, .add-to-wl-btn *')) {

        toast('Προστέθηκε στο <a href="/wishlist">wishlist</a>!');
        addToWishlist(tar.parents('.product, .item-content-wrapper'));
        e.preventDefault();
        e.stopPropagation();
        return false;

    }

    if (tar.is('.toast span')) tar.parents('.toast').addClass('retired');

});

function addToWishlist(productElement) {

    var product = {

        bnid: productElement.attr('data-bnid'),
        quantity: 1

    }

    lists.add('wishlist', product);

}

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

        if (product.bnid in this['_' + list]) return toast('Αυτό το αντικείμενο είναι ήδη στη λίστα σας!');

        this['_' + list][product.bnid] = product;

        this.save();

        list == 'cart' && ga('send', 'event', 'site-action', 'add-to-cart');
        list == 'wishlist' && ga('send', 'event', 'site-action', 'add-to-wishlist');

    },

    get toString() {

        return JSON.stringify({

            cart: this._cart,
            wl: this._wishlist

        });

    },

    empty: function (list) {

        this['_' + list] = {};

    },

    updateCartPrice: function(){
    
        if (!this.length) {

            $('.cart-text').html('Το καλάθι σας είναι άδειο');
            $('.cart-checkout').html('0,00 &euro;');

        } else {

            $('.cart-text').html('Καλάθι (' + this.length + ')');
            $('.cart-checkout').html(this.price + ' &euro;');

        }

        $('.cart-list-final-price .send-cost a').html(this.shippingCost + ' &euro;');
        $('.cart-list-final-price .final-price a').html(this.price + ' &euro;');

        var wlLength = Object.keys(this._wishlist).length;

        wlLength = wlLength ? ' (' + wlLength + ')' : '';

        $('.logout-btn a:first-child').html('Wishlist' + wlLength);

    },

    get shippingCost() {

        var price = 0;
        for (var bnid in this._cart) price += +this._cart[bnid].price * this._cart[bnid].quantity;

        if (price && _userData && _userData.shippingMinimum && price < _userData.shippingMinimum) return _userData.shippingCost;

        return 0;

    },

    remove: function (list, bnid) {

        delete this['_' + list][bnid];
        this.save();

        list == 'cart' && ga('send', 'event', 'site-action', 'remove-from-cart');
        list == 'wishlist' && ga('send', 'event', 'site-action', 'remove-from-wishlist');

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

        if (price && _userData && _userData.shippingMinimum && price < _userData.shippingMinimum) price += _userData.shippingCost || 0;

        price = String(price).split('.').length > 1 ? String(price).split('.')[0] + '.' + String(price).split('.')[1].substr(0, 2) : String(price);

        return price.split('.')[1] && price.split('.')[1].length < 2 ? price + '0' : price;


    },

    get length() {

        var length = 0;

        for (var bnid in this._cart) length += +this._cart[bnid].quantity;

        return length;

    }

}

window.tmp = ['cart', 'wl'];

tmp.forEach(function (s) {

    try{
        if (_userData[s]) localStorage.setItem(s + 'Data', JSON.stringify(_userData[s]));
    } catch (err) { }

});

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

}, 500);