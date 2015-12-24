global.MailOptions = function (data) {

    this.from = data.from || config.defaultEmailFrom;
    this.to = data.to;

    this.subject = data.subject || "";
    this.text = data.text || "";

    this.html = data.html || "";

}