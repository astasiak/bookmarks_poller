var sources = []

function getRemoveHandler(div) {
  return () => {
    div.getElementsByClassName('sourceRemove')[0].classList.add('hidden');
    div.getElementsByClassName('sourceRemoveConfirm')[0].classList.remove('hidden');
    setTimeout(() => {
      div.getElementsByClassName('sourceRemove')[0].classList.remove('hidden');
      div.getElementsByClassName('sourceRemoveConfirm')[0].classList.add('hidden');
    }, 2000);
  }
}

function getRemoveConfirmHandler(source) {
  return () => {
    sources = sources.filter(function(item) {
      return item !== source
    });
    chrome.storage.sync.set({'bookmarkSources': sources})
    displayExistingSources();
  }
}

function displayExistingSources() {
  
  var sourcesElement = document.getElementById('existingSources');
  sourcesElement.innerHTML = '';
  if (sources.length == 0) {
    sourcesElement.innerHTML = '<div class="sourcesMessage">No bookmark sources configured...<div>';
  }
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    var div = document.createElement("div");
    div.classList.add("source")
    div.innerHTML = `
        <button type="button" class="sourceRemove">delete</button>
        <button type="button" class="sourceRemoveConfirm hidden">confirm?</button>
        <div class="sourceTitle">${source.title}</div>
        <div class="sourceLink" title="${source.url}">${source.url}</div>`;
    div.getElementsByClassName('sourceRemove')[0].addEventListener('click', getRemoveHandler(div));
    div.getElementsByClassName('sourceRemoveConfirm')[0].addEventListener('click', getRemoveConfirmHandler(source));
    sourcesElement.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var addButton = document.getElementById('addSource');
  var urlInput = document.getElementById('urlInput');

  chrome.storage.sync.get(['bookmarkSources'], function(result) {
    sources = result['bookmarkSources'] || [];
    displayExistingSources();
  });

  function addSource() {
    var url = urlInput.value;
    if (url) {
      var tempTitle = url.split('/').pop();
      var newSource = {'title': tempTitle, 'url': url};
      sources.push(newSource);
      urlInput.value = '';
      displayExistingSources();
      processBookmarkSource(newSource, displayExistingSources);
    }
  }

  addButton.addEventListener('click', addSource);
});
