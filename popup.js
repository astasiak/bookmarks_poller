var sourcesCache = []

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
    sourcesCache = sourcesCache.filter(function(item) {
      return item !== source
    });
    saveSources(sourcesCache);
    if (source.bookmarkId) {
      removeBookmark(source.bookmarkId);
    }
    displayExistingSources();
  }
}

function refreshSources() {
  loadSources((sources) => {
    sourcesCache = sources;
    displayExistingSources();
  });

}

function displayExistingSources() {
  
  var sourcesElement = document.getElementById('existingSources');
  sourcesElement.innerHTML = '';
  if (sourcesCache.length == 0) {
    sourcesElement.innerHTML = '<div class="sourcesMessage">No bookmark sources configured...<div>';
  }
  for (var i = 0; i < sourcesCache.length; i++) {
    var source = sourcesCache[i];
    var div = document.createElement("div");
    div.classList.add("source")
    var errorClass = source.error ? 'errorShow' : 'errorHide';
    div.innerHTML = `
        <button type="button" class="sourceRemove">delete</button>
        <button type="button" class="sourceRemoveConfirm hidden">confirm?</button>
        <div class="sourceTitle"><span class="${errorClass}">⚠</span>${source.title}</div>
        <div class="sourceLink" title="${source.url}">${source.url}</div>`;
    div.getElementsByClassName('sourceRemove')[0].addEventListener('click', getRemoveHandler(div));
    div.getElementsByClassName('sourceRemoveConfirm')[0].addEventListener('click', getRemoveConfirmHandler(source));
    sourcesElement.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var addButton = document.getElementById('addSource');
  var urlInput = document.getElementById('urlInput');

  refreshSources();

  function addSource() {
    var url = urlInput.value;
    if (url) {
      var tempTitle = url.split('/').pop();
      var newSource = {'title': tempTitle, 'url': url};
      urlInput.value = '';
      upsertSource(newSource, (insertedSource) => {
        refreshSources();
        createBookmarksFromSource(insertedSource, refreshSources);
      });
    }
  }

  addButton.addEventListener('click', addSource);
});
