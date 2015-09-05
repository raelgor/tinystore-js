var nodemailer = require('nodemailer');
var emailTemplates = {

    verification: jade.compileFile(__dirname + '/email.verification.jade', {})

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
    email.sendMail(options, function () { console.log(arguments); });

}