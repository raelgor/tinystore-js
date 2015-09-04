module.exports = function (string) {

    string = string || "";

    var ret = "";
    var letters = {
        "α": "a",
        "ά": "a",
        "β": "v",
        "γ": "g",
        "δ": "d",
        "ε": "e",
        "έ": "e",
        "ζ": "z",
        "η": "h",
        "ή": "h",
        "θ": "th",
        "ι": "i",
        "ί": "i",
        "κ": "k",
        "λ": "l",
        "μ": "m",
        "ν": "n",
        "ξ": "ks",
        "ο": "o",
        "ό": "o",
        "π": "p",
        "ρ": "r",
        "σ": "s",
        "ς": "s",
        "τ": "t",
        "υ": "u",
        "ύ": "u",
        "φ": "f",
        "χ": "x",
        "ψ": "ps",
        "ω": "o",
        "ώ": "o"
    }

    string = string.trim().split(' ').join('-').split(/[\(\)]*/).join('').toLowerCase().split(/[\.\:\,\!\?\;]/).join('');

    string.split('').forEach(function (l) {

        ret += letters[l] || (/^[a-zA-Z0-9\-]$/.test(l) ? l : "");

    });

    return ret;

}