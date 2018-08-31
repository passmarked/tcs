const url       = require('url');
const async     = require('async');
const _         = require('underscore');
const cheerio   = require('cheerio');
const natural   = require('natural').TfIdf;
const tfidf     = new TfIdf();

/**
* Known list of "terms" words
**/
var KEYWORDS = [

  'terms',
  'terms of service'
  
];

// load up
for(var i = 0; i < KEYWORDS.length; i++) {

  // add to the list
  tfidf.addDocument(KEYWORDS[i]);

}

/**
* A check to see whether there are at least 2 DNS servers configured
**/
module.exports = exports = function(payload, fn) {

  // get the url
  var data = payload.getData();

  // check if we got a url
  if(!data.url) return fn(null);

  // get the url
  var uri = url.parse(data.url || '');

  // get the page content and it's link
  payload.getPageContent(function(err, body) {

    // get the links
    var $ = cheerio.load(body || '');

    // loop it
    var anchors = $('a');

    // did we find the link?
    var pageTagged = false;

    // loop them all
    async.eachLimit(anchors, 10, function(el, cb) {

      // skip it
      if(pageTagged == true) return cb(null);

      // get the links
      tfidf.tfidfs($(el).text() || '', function(i, measure) {

        // check if bigger?
        if(measure >= 1) {

          // set it
          pageTagged = true;

        }

        // done
        cb(null);

      });

    }, function() {

      // check if homepage
      if(uri.pathName == '/' && 
          pageTagged == true) {

        // add the rule
        payload.addRule({

          type:     'warning',
          message:  'No Terms of Service linked from homepage',
          key:      'terms'

        });

      }

      // done
      fn(null);

    });

  });

};
