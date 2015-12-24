global.User = function (data) {

    // We must always have an object as data
    data = typeof data == 'object' ? data : {};

    // Right explicit data
    for (var key in data) this[key] = data[key];

    // Ensure user has a valid ObjectID
    this._id = this._id ? new ObjectID(String(this._id)) : new ObjectID();

    // Must have list objects
    this.lists = this.lists || { wl: {}, cart: {} };

    // Ensure uuid
    this.uuid = this.uuid || zx.uuid().split('-').join('');

    // Ensure email is not undefined in case we
    // later insert in mongo
    this.email = this.email || "";

    // If no password, generate a random one
    this.password = this.password || pwh.generate(zx.uuid(), { algorithm: "sha256", saltLength: 15 });

    // Default language if no language
    this.lang = this.lang || "gr";

    // Default to unverified
    this.verified = this.verified || 0;

    // If unspecified it means there is no such request pending
    this.lastEmailVerificationToken = this.lastEmailVerificationToken || "";
    this.lastForgotPasswordToken = this.lastForgotPasswordToken || "";

    // This counter is used accross all emails
    this.lastVerificationEmailTS = this.lastVerificationEmailTS || 0;

    // Add bnids to lists or add quantity
    this.addLists = function (lists) {

        for (var key in lists)
            for (var bnid in lists[key]) {

                if (isNaN(+bnid)) continue;

                this.lists[key][bnid] = this.lists[key][bnid] || {
                    bnid: bnid,
                    quantity: 0
                }

                this.lists[key][bnid].quantity += !isNaN(lists[key][bnid].quantity) ? +lists[key][bnid].quantity : 0;

            }

    }

    // Set lists from post request (or wherever)
    this.setLists = lists => {

        this.lists = { wl: {}, cart: {} }
        this.addLists(lists);

    }

    // Update from db -- hardcoded to global appServer obj --
    this.updateRecord = function () {

        appServer.db.collection('users').update(
            // Find by this index
            { uuid: this.uuid },
            // Upsert model
            this,
            // Enable upsert
            { upsert: 1 }, function () { console.log(arguments); }
        );

    }

    // Check last email and send
    this.sendForgotPasswordEmail = function () {

        // If another such email was sent with the last
        // 24h, abort
        if (new Date().getTime() - this.lastVerificationEmailTS < 1000 * 60 * 60 * 24) {

            return false;

        } else {

            // Update record
            this.lastVerificationEmailTS = new Date().getTime();
            this.lastForgotPasswordToken = zx.uuid().split('-').join('');

            // Send email
            email.sendForgotPasswordEmail(this.email, this.lastForgotPasswordToken);

        }

    }

    // Reset password
    this.resetPassword = function (newPassword) {

        this.password = pwh.generate(newPassword, { algorithm: "sha256", saltLength: 15 })

    }

    // Check and send
    this.sendVerificationEmail = function () {

        // Why would we verify if we're verified?
        if (this.verified) return;

        // If another such email was sent with the last
        // 24h, abort
        if (new Date().getTime() - this.lastVerificationEmailTS < 1000 * 60 * 60 * 24) {

            return false;

        } else {

            // Update record
            this.lastVerificationEmailTS = new Date().getTime();
            this.lastEmailVerificationToken = zx.uuid().split('-').join('');

            // Send email
            email.sendVerificationEmail(this.email, this.lastEmailVerificationToken);

        }

    }

}