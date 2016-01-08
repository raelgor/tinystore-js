var nodemailer = require('nodemailer');
var emailTemplates = {

    verification: jade.compileFile(__dirname + '/email.verification.jade', {}),
    fpass: jade.compileFile(__dirname + '/email.fpass.jade', {}),
    order: jade.compileFile(__dirname + '/email.order.jade', {}),
    orderClient: jade.compileFile(__dirname + '/email.orderClient.jade', {})

}

// Create reusable transporter object using SMTP transport
global.email = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

email.sendVerificationEmail = function (to, token) {

    var options = new MailOptions({

        to: to,
        html: emailTemplates.verification({ token: token })

    });

    // Send mail with defined transport object
    email.sendMail(options, function () {  });

}

email.sendForgotPasswordEmail = function (to, token) {

    var options = new MailOptions({

        to: to,
        html: emailTemplates.fpass({ token: token })

    });

    // Send mail with defined transport object
    email.sendMail(options, function () {  });

}


email.sendOrderInfoEmail = function (to, order) {

    var options = new MailOptions({

        to: to,
        subject: 'Νέα παραγγελία: ' + order.orderId,
        html: emailTemplates.order({
            order: order,
            alias: alias,
            price: price
        })

    });

    // Send mail with defined transport object
    email.sendMail(options, function () {  });

}

email.sendOrderInfoEmailToClient = function (to, order) {

    var options = new MailOptions({

        to: to,
        subject: 'Η παραγγελία σας στο Παζάρι Βιβλίου: ' + order.orderId,
        html: emailTemplates.orderClient({
            order: order,
            alias: alias,
            price: price
        })

    });

    // Send mail with defined transport object
    email.sendMail(options, function () {  });

}