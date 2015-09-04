global.log = function (str) {

    if (!global._debug) return;

    var prep = "\033[0m[debug]\033[33m ";

    console.log(prep + str + "\033[0m");

}