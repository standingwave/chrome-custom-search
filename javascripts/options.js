// window.onload = init;
document.addEventListener('DOMContentLoaded', function () {
  console.log('add event listener');
  document.querySelector('button').addEventListener('click', saving);
  init();
});

function saving() {
  console.log('saving');
  var varsafe = true;	

  if (false) { 
    alert("Numeric Values Only!");
    varsafe = false;
  }

  if (varsafe == true) {
    localStorage.framerate = framerate;
    localStorage.animtime = animtime;
    localStorage.scrollsz = scrollsz;

    var saving = document.getElementById("saving");
    saving.innerHTML = "Settings saved!";
    var message = document.getElementById("message");
    message.innerHTML = "<a href=\"#\" onclick=\"reload()\">Reload this page and test the new scroll settings!</a>";
      setTimeout(function() {
      saving.innerHTML = "&nbsp;";
    }, 1500);
  }
}

function reload() {
  window.location.reload();
}
function init() {
  console.log('init');
  //Fixes a strange bug
  if(keyboardsupport == "true") {
    document.getElementById('keyboardsupport').checked = true;
  }
}

function get_manifest(callback){
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    callback(JSON.parse(xhr.responseText));
  };
  xhr.open('GET', 'manifest.json',true);
  xhr.send(null);
}

get_manifest(function(manifest) {
  version = manifest.version;
  document.getElementById("version").innerHTML=version;
});