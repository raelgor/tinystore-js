global.SessionToken = function (data) {

    data = data || {};

    this.expires = data.expires || new Date().getTime() + 1000 * 60 * 60 * 24 * 30;
    this.token = zx.uuid().split('-').join('');

    this.csrf = zx.uuid();

}