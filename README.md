# tinystore-js
A tiny eshop with custom NodeJS server.

Live: https://pazari-vivliou.gr

**Why you may need this:**
- Contains biblionet.gr data scrapper *(make sure you cache data and give credits)*
- Works super fast and easy to install on a Google Cloud Platform Debian VM

**INSTALLATION**
- Create a ``config.json`` file based on ``config.json.md``
- Run ``npm install``
- To start:
    - On **Linux**: run ``chmod 755 *`` in ``./bin`` and then execute ``tsstart``
    - On **Windows**: @todo make Windows scripts. For now you need to read ``./bin/tsstart`` and do what it does for Windows.
- Keep in mind that many things are still hardcoded

**TODO**
- Remove hardcoded stuff and link to `config.json` and db entries
- Update and enable ZenX Platform CMS
- Add `mkdirp` and use it to create `./logs/*` and `./cache`
- Create default data
- Remove useless assets
