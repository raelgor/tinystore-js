'use strict';

module.exports = (html, scrap, i) => {
    
    let data = {
        
        bnid:         i,
        books:        [],
        name:         scrap(html, /class\=\"page\_title\"\>\<strong\>(.*)\<\/strong\>/),
        description:  scrap(html, '<meta name="Description" content="', '">'),
        img:          scrap(html, /(\/images\/persons\/[a-z0-9]+\.[a-z]{3})/)
        
    }

    // Trim if possible
    for(let key in data)
        data[key] = data[key] && data[key].trim ? data[key].trim() : data[key];
        
    data.alias = data.name && alias(data.name);

    let _ = html.split('main.asp?page=showbook&bookid=');
    _.shift();
    _.forEach(shard => {

        let catBnid = shard.split('"')[0];

        /[0-9]*/.test(catBnid) && data.books.push(String(catBnid));

    });
    
    return data;
    
}