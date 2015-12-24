window.submitOrderPage = function () {

    $('form.order-form').submit(function (e) {

        var errorMsg = "";

        e.preventDefault();
        e.stopPropagation();

        if (!Object.keys(lists._cart).length) errorMsg += 'Το καλάθι σας φαίνεται να είναι άδειο! Προσθέστε αντικείμενα πατώντας "Προσθήκη στο καλάθι" και επιστρέψτε σε αυτή τη σελίδα.';

        if(!grecaptcha.getResponse(window._submit_order_rc)) errorMsg += ' Παρακαλούμε επιβεβαιώστε ότι δεν είστε ρομπότ κάνοντας κλικ στο παραπάνω κουτάκι.'
        
        if (!_userData.verified) errorMsg += ' Παρακαλούμε επιβεβαιώστε την ηλεκτρονική σας διεύθυνση κάνοντας κλικ στον σύνδεσμο που σας έχουμε στείλει, για να μπορείτε να κάνετε παραγγελίες από τον λογαριασμό σας.';

        if (!errorMsg) send(); else {

            $(this).find('.error').html(errorMsg);

            ga('send', 'event', 'site-action', 'place-order-form-error', errorMsg);

        }

        function send() {

            $.post('/api/order', {

                firstname: $('.order-form ._fn').val(),
                lastname: $('.order-form ._ln').val(),
                country: $('.order-form ._cn').val(),
                city: $('.order-form .ct').val(),
                address: $('.order-form .ad').val(),
                zip: $('.order-form .tk').val(),
                phone: $('.order-form .ph').val(),
                dou: $('.order-form .dou').val(),
                afm: $('.order-form .afm').val(),
                profession: $('.order-form .prof').val(),
                lists: lists.toString,
                csrf: _userData.csrf

            }, function (res) {

                try {
                    res = JSON.parse(res);
                } catch (err) { res = {} }

                !res.success && grecaptcha.reset();
                !res.success && $('.order-form .error').html('Υπήρξε κάποιο σφάλμα :( Παρακαλούμε ελέγξτε τα στοιχεία της φόρμας και προσπαθήστε ξανά σε λίγο. Εάν συνεχίζετε να έχετε πρόβλημα με την υποβολή της παραγγελίας σας, παρακαλούμε καλέστε μας ' + _userData.phoneHours + ' στο ' + _userData.phone);

                if (res.success) {

                    lists.empty('cart');
                    lists.save();

                    $('.cart-checkout-wrapper').css('display', 'none');
                    $('.cart-order-success').css('display', 'block');

                    $('#order-id-socket').html(res.orderId);
                    $('#phone-socket').html(_userData.phone);

                    ga('send', 'event', 'site-action', 'place-order-success');

                } else ga('send', 'event', 'site-action', 'place-order-failure');

            });

        }

        return false;

    });

}