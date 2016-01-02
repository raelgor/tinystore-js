'use strict';

module.exports = (html, scrap, i) => {
    
    let data = {
        
        bnid:         i,
        categories:   [],
        title:        scrap(html, /class\=\"book\_title\"\>\<strong\>(.*)\<\/strong\>/),
        description:  scrap(html, '<meta name="Description" content="', '">'),
        price:        scrap(html, ' &euro; ', '<'),
        authorId:     scrap(html, /personsid\=([0-9]*)\>/),
        isbn:         scrap(html, 'ISBN ', /[,\, ]/),
        isbn13:       scrap(html, 'ISBN-13 ', /[,\, \[\<]/),
        year:         scrap(html, /class='book_details'>,[ ]*/, /[<>br \,]/),
        pages:        scrap(html, /\<br\>([ 0-9]*)σελ.\<br\>/),
        img:          scrap(html, /(\/images\/covers\/[a-z0-9]+\.[a-z]{3})/),
        translator:   html.split('μετάφραση: <a ')[1] && scrap(html.split('μετάφραση: <a ')[1], '>', '</a'),
        unavailable:  html.split("[Εξαντλημένο]").length > 1
        
    }

    // Trim if possible
    for(let key in data)
        data[key] = data[key] && data[key].trim ? data[key].trim() : data[key];
        
    data.price = data.price && +data.price.replace(/\,/,'.');
    data.alias = data.title && alias(data.title);

    // Make numbers
    for(let numeric of [

        'pages',
        'price',
        'authorId',
        'year'

    ]) data[numeric] = isNaN(data[numeric]) ? undefined : +data[numeric];

    let _ = html.split('/main.asp?page=index&subid=');
    _.shift();
    _.forEach((shard) => {

        let catBnid = shard.split('"')[0];

        /[0-9]*/.test(catBnid) && data.categories.push(String(catBnid));

    });
    
    return data;
    
}