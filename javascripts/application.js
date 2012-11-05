CSE = {};
CSE.annotations = [];
CSE.item;

jQuery(document).ready(function($) {
  
  setupHandlers();

  function init() {
    console.log('init');

    chrome.browserAction.setBadgeText({text: ''});
    getConfig();
    
    CSE.template = $('#template')
    CSE.about = $('.about');
    CSE.directive = $('.directive');
    CSE.comment = $('.comment');
    
    CSE.fetchFreq = 30000; // how often we fetch new annotations (30s)
    CSE.req; // request object
    CSE.unreadCount = 0; // how many unread annotations we have

    displayEngineList();
    getTargetUrl();
    setupTagsInput();
    // getAnnotations();
  }
  
  init();

  function setupHandlers() {
    $('.close_window').click(function(e) {
      window.close();
    });
    
    $('.close').live('click', function(e) {
      e.preventDefault();
      $(this).parent().hide();
    });
    
    $("#messages").ajaxError(function(event, request, settings){
      displayMessage("Error requesting page: " + settings.url, 'error');
      $('.loading').hide();
    });
    
    $('#edit_engine').on('click', function(e) {
      if($('#engine :selected').length > 0) {
        console.log($('#engine :selected').val() + ' selected');
        _getJSON(urlFor('engines/' + $('#engine :selected').val()), function(result) {
          console.log('result: ' + result);
        });
      }
    });
    $('#engine_id').on('change', function(e) {
      console.log($('#engine_id :selected').val() + ' selected');
    
      _getJSON(urlFor('engines/' + $('#engine_id :selected').val() + '.json'), function(res) {
        $('.tags_input').importTags('');
        $.each(res.tags, function(i, tag) {
          $('.tags_input').addTag(tag.name);
        });
      });
    });

    $('form#create_annotation').on('submit', function(e) {
      e.preventDefault();
      
      $(this).attr('disabled', 'true');
      $('.loading', this).show();
      
      var self = this;
      _postJSON(urlFor("engines/create_annotation"), $(this).serialize(), function(data) {
        console.log(data);
        $(this).removeAttr('disabled');
        $('.loading', self).hide();
        
        $('input:text,textarea', self).val('');
        $('.messages', self).empty();
      
        displayMessage('Created annotation for: ' + data.about, 'notice');
      });

      return false;
    });
  }
  
  function setupTagsInput() {
    $('.tags_input').tagsInput({    
      autocomplete_url:'http://localhost:5000/tags/autocomplete'
    });
  }
  
  function displayEngineList() {
    _getJSON(urlFor('engines.json'), function(res) {
      $.each(res, function(i, engine) {
        var el = $('<option value="' + engine._id + '">' + engine.name + '</option>');
        $('#engine_id').append(el);
      });
    }, 'json');
  }
  
  function getConfig() {
    CSE.api_url = localStorage.cse_api_url || 'http://localhost:5000/';
    CSE.api_key = localStorage.cse_api_key;
    if (!CSE.api_key) { displayMessage('Please add a valid API KEY.', 'notice'); return false; }
  }
  
  function getTargetUrl() {
    chrome.tabs.query({
        active: true,                              // Select active tabs
        windowId: chrome.windows.WINDOW_ID_CURRENT // In the current window
      }, 
      function(tabs) {
        var tab = tabs[0];
        CSE.url = tab.url;
        CSE.parsed_uri = parseUri(CSE.url);
        setTargetDisplay();
      }
    );
  }
  
  function setTargetDisplay() {
    $('#about_domain').val(CSE.parsed_uri.host);
    $('#domain_link').html(CSE.parsed_uri.host);
    
    $('#about_page').val(CSE.url);
    $('#page_link').html(CSE.url);
  }
  
  function getAnnotations() {
    console.log('get annoations');
    
    CSE.req = new XMLHttpRequest();
    CSE.req.open('GET', 'http://localhost:5000/cse_annotations.json');
    CSE.req.onload = processAnnotations;
    CSE.req.send();
  }

  // process new batch of annotations
  function processAnnotations() {
    console.log('process annoations');

    CSE.res = JSON.parse(CSE.req.responseText);
    CSE.unreadCount += CSE.res.length;

    if (CSE.unreadCount > 0) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 0, 0, 255]
      });
      chrome.browserAction.setBadgeText({text: '' + CSE.unreadCount});
    }
    CSE.annotations = CSE.res.concat(CSE.annotations);
    displayAnnotations();
  }

  function displayAnnotations() {
    console.log('displayAnnotations');
    
    var about = CSE.about[0].cloneNode(),
        directive = CSE.directive[0].cloneNode(), 
        comment = CSE.comment[0].cloneNode(),
        annotation_root = $('<div/>');
    
    console.log(CSE.annotations);
    for (var i in CSE.annotations) {
      // author.href = openInNewTab(url);
      
      about.innerHTML = CSE.annotations[i].about;
      directive.innerHTML = CSE.annotations[i].directive;
      comment.innerHTML = CSE.annotations[i].comment;

      annotation_root.append(about).append(directive).append(comment);
      console.log('Item: ' + annotation_root.html());
      $('.annotations').append(CSE.item);
    }
  }
});

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};