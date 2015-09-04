global.price = function (price, marketPrice) {

    var finalPrice = "";

    marketPrice = parseFloat(marketPrice);
    price = parseFloat(price);

    finalPrice = marketPrice && (parseFloat(marketPrice) < (parseFloat(price) * .80 || Infinity)) ? Math.round(parseFloat(marketPrice) * .95 * 100) / 100 : Math.round(price * .80 * 100) / 100;

    // Make sure there's 2 digits after decimal point
    return finalPrice + (String(finalPrice).split('.')[1] && String(finalPrice).split('.')[1].length != 2 ? '0' : '');

};