global.User = function (data) {

    data = data || {}

    for (var key in data) this[key] = data[key];

    this._id = this._id ? new ObjectID(String(this._id)) : new ObjectID();
    this.uuid = this.uuid || zx.uuid().split('-').join('');
    this.email = this.email || "";
    this.password = this.password || pwh.generate(zx.uuid(), { algorithm: "sha256", saltLength: 15 });

    this.lang = this.lang || "gr";
    this.lastEmailVerificationToken = this.lastEmailVerificationToken || "";

    this.verified = this.verified || 0;

    this.lastVerificationEmailTS = this.lastVerificationEmailTS || new Date().getTime();

}