ROUTER = {
  'engines': 'engines.json'
}

function _getJSON(url, callback) {
  console.log('get some json: ' + url);
  $.get(url, function(result) {
    callback(result);
  });
}

function displayMessage(msg, msg_type) {
  var html = '<div class="alert alert-' + msg_type + '">' +
    '<a class="close" "data-dismiss"="alert">×</a>' +
    '<div id="flash_notice">' + msg + '</div>' +
  '</div>'
  
  $('#messages').html(html).show();
}

function urlFor(options) {
  console.log('generating url for: ' + options);
  var url = '';
  
  if(typeof options === 'string') {
    url = CSE.api_url + options;
  } else if(typeof options === 'object') {
    // TODO: create url from options
    url = parseUrlOptions(options);
  } else {
    console.error("Could not create urlFor: " + options);
  }
  return url
}

function parseUrlOptions(urlOptions) {
  var host = urlOptions.host || CSE.api_url;
  return host + urlOptions.path + '?' + urlOptions.params + '#' + urlOptions.anchor
}

// evaluate xpath
function xpath(path, node) {
  return document.evaluate(path, node).iterateNext();
}

// open link in new tab
function openInNewTab(url) {
  return 'javascript:chrome.tabs.create({url: \'' + encodeURI(url) + '\'})';
}

// add links to tweet
function linkify(tweet) {
  // links
  tweet = tweet.replace(
    /[a-z\d+-.]+:\/\/[\w\d$-+!*'(),;?:@&=%]+\.[\w\d$-.+!*'(),;\/?:@&=%]+/ig,
    function(str) {
      return '<a href="javascript:chrome.tabs.create({url: \'' + encodeURI(str)
        + '\'})">' + str + '</a>';
    }
  );

  // twitter ids
  tweet = tweet.replace(/@\w+/g, function(str) {
    return '<a href="javascript:chrome.tabs.create({url: \'http://twitter.com/' 
      + str.substring(1) + '\'})">' + str + '</a>';
  });

  // twitter hashes
  tweet = tweet.replace(/#[a-z]+/ig, function(str) {
    return '<a href="javascript:chrome.tabs.create({url: \'http://twitter.com/#search?q=%2523'
      + str.substring(1) + '\'})">' + str + '</a>';
  });

  return tweet;
}
