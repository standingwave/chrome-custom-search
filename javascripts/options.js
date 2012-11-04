// window.onload = init;
document.addEventListener('DOMContentLoaded', function () {
  console.log('add event listener');
  document.querySelector('button').addEventListener('click', saving);
  init();
});

function saving() {
  console.log('saving');
  if (document.getElementById("api_key").value.length > 0) {
    localStorage.cse_api_url = document.getElementById("api_url").value;
    localStorage.cse_api_key = document.getElementById("api_key").value;

    var saving = document.getElementById("saving");
    saving.innerHTML = "Settings saved!";
  } else {
    alert("A valid API KEY is required to use this add on");
  }
}

function reload() {
  window.location.reload();
}
function init() {
  console.log('init');
  // TODO: Might need this later to implement a keyboard short cut
  // if(keyboardsupport == "true") {
  //   document.getElementById('keyboardsupport').checked = true;
  // }
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