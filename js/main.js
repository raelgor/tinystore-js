var app = {

    onstart: []

};

// Unexpected logout due to expired token
if (_userData.clearLocalStorage) {
    localStorage.removeItem('wlData');
    localStorage.removeItem('cartData');
    ga('send', 'event', 'site-action', 'clear-local-storage-from-server-logout');
}

window._NOT_TOUCH = 0;

window.fbAsyncInit = function () {
    FB.init({
        appId: '1654710454804015',
        xfbml: true,
        version: 'v2.4'
    });
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Twitter Async
window.twttr = (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0],
      t = window.twttr || {};
    if (d.getElementById(id)) return t;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function (f) {
        t._e.push(f);
    };

    return t;
}(document, "script", "twitter-wjs"));

// Init
$(document).ready(function () {
    
    app.onstart.forEach(function (fn) { try { fn(); } catch (err) { console.log(err); } });

    app.onresize();

    $('.cart-checkout-wrapper').length && submitOrderPage();

    $('.cart-checkout-wrapper').length && window.cartPage();

    $('.search-wrapper form').submit(function () { toast('Γίνεται αναζήτηση σε χιλιάδες βιβλία... Παρακαλούμε περιμένετε... :)'); });

    $('.search-wrapper input').focus(function () { $(this).select(); });

    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {

        // Not touch devices
        $('.search-wrapper input').focus();
        $('head').append("<style>.listing-category .product:hover, .sub-cat:hover { transform: scale(1.05); -webkit-transform: scale(1.05); -moz-transform: scale(1.05); -ms-transform: scale(1.05); -o-transform: scale(1.05); }</style>");

        _NOT_TOUCH = 1;

    } else {

        // Touch devices
        $('head').append("<style>table.gc-bubbleDefault.pls-container { position: fixed;top: 0px;}</style>")

    }

    $('.lgt-click').click(function (e) {

        $.post('/api/logout', { csrf: _userData.csrf }, function (res) {

            localStorage.removeItem('wlData');
            localStorage.removeItem('cartData');

            try { ga('send', 'event', 'site-action', 'logout-click'); } catch (err) { }

            window.location.reload();

        });

        e.preventDefault();
        e.stopPropagation();

        return false;

    });

    $('.f-pass-reset-form').submit(function (e) {

        e.preventDefault();

        if (!grecaptcha.getResponse(window._fpassreset_rc)) {

            $('.error').html('Παρακαλούμε επιβεβαιώστε ότι δεν είστε ρομπότ κάνοντας κλίκ στο παραπάνω κουτάκι.');

            return false;

        }

        $.post('/api/fpassreset', {
            password: String(CryptoJS.MD5($('.f-pass-reset-form [type="password"]').val())),
            token: _userData.fpasstoken,
            cp_key: grecaptcha.getResponse(window._fpassreset_rc)
        }, function (res) {

            try {

                res = JSON.parse(res);
                console.log(res);

            } catch (err) { res = {} }

            if (res.success) {

                promptLogin();

            } else {

                grecaptcha.reset();
                $('.error').html('Παρακαλούμε ελέγξτε τα στοιχεία που δώσατε και ξαναπροσπαθήστε.')

            }

        });

    });

    $('.f-pass-form').submit(function (e) {

        e.preventDefault();

        if (!grecaptcha.getResponse(window._fpass_rc)) {

            $('.error').html('Παρακαλούμε επιβεβαιώστε ότι δεν είστε ρομπότ κάνοντας κλίκ στο παραπάνω κουτάκι.');

            return false;

        }

        $.post('/api/fpass', {
            email: $('.f-pass-form [type="email"]').val(),
            cp_key: grecaptcha.getResponse(window._fpass_rc)
        }, function (res) {

            try {

                res = JSON.parse(res);
                console.log(res);

            } catch (err) { res = {} }

            if (res.success) {

                $('.f-pass-form').html('');
                $('.tab.f-pass .tab-head-tagline').html('Σας στείλαμε ένα email με οδηγίες ανάκτησης του κωδικού σας.');
                $('.tab.f-pass .tab-head').html('Σχεδόν έτοιμοι!');

            } else {

                grecaptcha.reset();
                $('.error').html('Παρακαλούμε ελέγξτε τα στοιχεία που δώσατε και ξαναπροσπαθήστε.')

            }

        });

    });

    $('.login-form').submit(function (e) {

        e.preventDefault();

        if (!grecaptcha.getResponse(window._login_rc)) {

            $('.error').html('Παρακαλούμε επιβεβαιώστε ότι δεν είστε ρομπότ κάνοντας κλίκ στο παραπάνω κουτάκι.');

            return ga('send', 'event', 'site-action', 'login-form-error');

        }

        $.post('/api/login', {
            email: $('.login-form [type="email"]').val(),
            password: String(CryptoJS.MD5($('.login-form [type="password"]').val())),
            lists: lists.toString,
            cp_key: grecaptcha.getResponse(window._login_rc)
        }, function (res) {

            try {

                res = JSON.parse(res);

            } catch (err) { res = {} }

            if (res.success) {

                try { ga('send', 'event', 'site-action', 'login-success'); } catch (err) { }

                window.location.reload();

            } else {

                grecaptcha.reset();
                $('.error').html('Παρακαλούμε ελέγξτε τα στοιχεία που δώσατε και ξαναπροσπαθήστε.')

                ga('send', 'event', 'site-action', 'login-error');

            }

        });

    });

    $('.register-form').submit(function (e) {

        e.preventDefault();

        if (!grecaptcha.getResponse(window._register_rc)) {

            $('.error').html('Παρακαλούμε επιβεβαιώστε ότι δεν είστε ρομπότ κάνοντας κλίκ στο παραπάνω κουτάκι.');

            return ga('send', 'event', 'site-action', 'register-form-error');

        }

        $.post('/api/register', {
            email: $('.register-form [type="email"]').val(),
            password: String(CryptoJS.MD5($('.register-form [type="password"]').val())),
            lists: lists.toString,
            cp_key: grecaptcha.getResponse(window._register_rc)
        }, function (res) {

            try {

                res = JSON.parse(res);

            } catch (err) { res = {} }

            if (res.success) {

                try { ga('send', 'event', 'site-action', 'register-success'); } catch (err) { }
                window.location.reload();

            } else {

                grecaptcha.reset();

                if (res.error == 2) return $('.error').html('Υπάρχει ήδη ένας χρήστης με αυτό το email.');

                $('.error').html('Παρακαλούμε ελέγξτε τα στοιχεία που δώσατε και ξαναπροσπαθήστε.')

                ga('send', 'event', 'site-action', 'register-error');

            }

        });

    });

    window.FPASSRESET && setTimeout(promptResetPassword, 1000);

});

_userData.fpasstoken && (window.FPASSRESET = 1);

function promptResetPassword() {

    $('.fixed-windows > *, .fixed-windows > * > *').addClass('out');
    $('.fixed-windows, .f-window, .f-window .tab.f-pass-reset').removeClass('out');

    if (_NOT_TOUCH) $('.f-window .tab.f-pass-reset [type="password"]').focus();

    if (isNaN(window._fpassreset_rc)) window._fpassreset_rc = grecaptcha.render('forgot-password-reset-rc', {
        'sitekey': '6LcVDgwTAAAAAKH6x-F-CIg4AfX7Kic-rr5jBRNX',
        'theme': 'light'
    });

}

function promptLogin() {

    $('.fixed-windows > *, .fixed-windows > * > *').addClass('out');
    $('.fixed-windows, .f-window, .f-window .tab.login').removeClass('out');

    if (_NOT_TOUCH) $('.f-window .tab.login [type="email"]').focus();

    if (isNaN(window._login_rc))  window._login_rc = grecaptcha.render('login-rc', {
        'sitekey': '6LcVDgwTAAAAAKH6x-F-CIg4AfX7Kic-rr5jBRNX',
        'theme': 'light'
    });

    ga('send', 'event', 'site-action', 'prompt-login');

}

function promptRegister() {

    $('.fixed-windows > *, .fixed-windows > * > *').addClass('out');
    $('.fixed-windows, .f-window, .f-window .tab.register').removeClass('out');

    if (_NOT_TOUCH) $('.f-window .tab.register [type="email"]').focus();


    if (isNaN(window._register_rc)) window._register_rc = grecaptcha.render('register-rc', {
        'sitekey': '6LcVDgwTAAAAAKH6x-F-CIg4AfX7Kic-rr5jBRNX',
        'theme': 'light'
    });

    ga('send', 'event', 'site-action', 'prompt-register');

}

function promptFPass() {

    $('.fixed-windows > *, .fixed-windows > * > *').addClass('out');
    $('.fixed-windows, .f-window, .f-window .tab.f-pass').removeClass('out');
    $('.f-window .tab.f-pass [name="email"]').val($('.f-window .tab.login [name="email"]').val());

    if (_NOT_TOUCH) $('.f-window .tab.f-pass [name="email"]').focus();

    if (isNaN(window._fpass_rc)) window._fpass_rc = grecaptcha.render('forgot-password-rc', {
        'sitekey': '6LcVDgwTAAAAAKH6x-F-CIg4AfX7Kic-rr5jBRNX',
        'theme': 'light'
    });

    ga('send', 'event', 'site-action', 'prompt-fpass');

}

$(window).bind("touchend", function (e) {

    var tar = $(e.target);

    if (tar.is('.fixed-windows')) {
        tar.addClass('out');
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
});

function fbLogin() {

    FB.login(function (response) {

        if (response.status === 'connected') {

            // Logged into the app and Facebook.
            var accessToken = FB.getAccessToken();

            fbAuth(accessToken);

            ga('send', 'event', 'site-action', 'fb-auth');

        }

    }, { scope: 'public_profile,email' });

}

function fbAuth(accessToken) {

    $.post('/api/fbauth', {
        accessToken: accessToken,
        lists: lists.toString
    }).done(function (res) {

        JSON.parse(res).success && window.location.reload();

    }).fail(function (res) { console.log(res); });

}

function rccb() {

    if (!_userData.uuid && $('.wishlist-page-wrapper, .cart-checkout-wrapper').length) setTimeout(promptLogin, 1000);

    $('.cart-checkout-wrapper').length && (window._submit_order_rc = grecaptcha.render('submit-order-rc', {
        'sitekey': '6LcVDgwTAAAAAKH6x-F-CIg4AfX7Kic-rr5jBRNX',
        'theme': 'light'
    }));

}