var nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
global.email = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});