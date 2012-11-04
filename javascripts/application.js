CSE = {};
CSE.annotations = [];
CSE.item;

jQuery(document).ready(function($) {
  
  loadEventHandlers();
  
  function loadEventHandlers() {
    $('.close').live('click', function(e) {
      console.log("I been clicked!");
      e.preventDefault();
      
      $(this).parent().hide();
    });
  }
  // initialize timeline template
  function init() {
    console.log('init');

    chrome.browserAction.setBadgeText({text: ''});
    
    CSE.api_url = localStorage.cse_api_url || 'http://localhost:5000/';
    CSE.api_key = localStorage.cse_api_key;
    
    if (!CSE.api_key) { displayMessage('Please add a valid API KEY.', 'notice'); return false; }
    
    CSE.template = $('#template')
    CSE.about = $('.about');
    CSE.directive = $('.directive');
    CSE.comment = $('.comment');
    
    CSE.fetchFreq = 30000; // how often we fetch new annotations (30s)
    CSE.req; // request object
    CSE.unreadCount = 0; // how many unread annotations we have

    _getJSON(urlFor('engines.json'), function(res) {
      $.each(res, function(i, engine) {
        var el = $('<option value="' + engine._id + '">' + engine.name + '</option>');
        $('#engine_id').append(el);
      });
    }, 'json');

    getTargetUrl();
    
    $('.tags_input').tagsInput({    
      autocomplete_url:'http://localhost:5000/tags/autocomplete'
    });
    
    // getAnnotations();
  }
  
  init();

  function getTargetUrl() {
    chrome.tabs.query(
      {
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
    console.log(CSE.res);
    
    CSE.unreadCount += CSE.res.length;

    if (CSE.unreadCount > 0) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 0, 0, 255]
      });
      chrome.browserAction.setBadgeText({text: '' + CSE.unreadCount});
    }
    CSE.annotations = CSE.res.concat(CSE.annotations);
    update();
  }
  // onload = setTimeout(init, 0); // workaround for http://crbug.com/24467

  // update display
  function update() {
    console.log('update');
    var about = CSE.about[0].cloneNode(),
        directive = CSE.directive[0].cloneNode(), 
        comment = CSE.comment[0].cloneNode();
    
    console.log(CSE.annotations);
    for (var i in CSE.annotations) {
      // author.href = openInNewTab(url);
      
      CSE.annotation_root = $('<div/>');
      about.innerHTML = CSE.annotations[i].about;
      directive.innerHTML = CSE.annotations[i].directive;
      comment.innerHTML = CSE.annotations[i].comment;

      console.log('Annotation HTML: ');
      console.log('  : '+ CSE.annotation_root.html());

      // copy node and update
      CSE.item = CSE.annotation_root.append(about).append(directive).append(comment);
      console.log('Item: ' + CSE.item.html());
      $('.annotations').append(CSE.item);
    }
  }
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
    $.ajax(
      urlFor("engines/create_annotation"),
      {
        type: "post",
        data: jQuery('form#create_annotation').serialize(),
        dataType: "json"
      }
      ).success( function (data) {
        console.log(data);
        var el = jQuery('form#create_annotation');

        el.find('input:text,textarea').val('');
        el.find('.errors').empty();
        
        displayMessage('Created annotation for: ' + data.about);
      }
    ).error( function (data) {
      var error_list = jQuery.parseJSON(data.responseText);
      var el = jQuery('#new_business');
      
      // Create a list of errors
      var errors = jQuery('<ul />');
      errors.append('<li>Could not save for the following reasons:</li>');

      jQuery.each(error_list, function(i,value) {
        errors.append('<li>' + value + '</li>');
      });

      // Display errors on form
      el.find('.errors').html(errors);
    });
    return false;
  });
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