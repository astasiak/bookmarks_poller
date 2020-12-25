
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

  
  function getJson(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var json = JSON.parse(xmlHttp.responseText);
        callback(json);
      }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
  }

  function processBookmark(bookmark, parentId) {
    if (bookmark.url) {  
      chrome.bookmarks.create({'parentId': parentId, 'title': bookmark.name, 'url': bookmark.url});
    } else if (bookmark.folder) {
      chrome.bookmarks.create({'parentId': parentId, 'title': bookmark.name}, (bookmarkTreeNode) => {
        for (var i = 0; i < bookmark.folder.length; i++) {
          processBookmark(bookmark.folder[i], bookmarkTreeNode.id);
	      }
      });
    }
  }
  
  function updateBookmarks(response) {
    var managedBookmarks = response['bookmarks'];
    chrome.bookmarks.getSubTree("1", (bar) => {
      var existingBookmarks = new Map(bar[0].children.map((bm) => [bm.title, bm.id]));
      for (var i = 0; i < managedBookmarks.length; i++) {
      var bookmarkToAdd = managedBookmarks[i];
      if (existingBookmarks.has(bookmarkToAdd.name)) {
        chrome.bookmarks.removeTree(existingBookmarks.get(bookmarkToAdd.name));
      }
      processBookmark(bookmarkToAdd, "1");
      }
    });
  }

  function addSource() {
    var url = urlInput.value;
    if (url) {
      var tempTitle = url.split('/').pop();
      var newRow = {'title': tempTitle, 'url': url};
      sources.push(newRow);
      urlInput.value = '';
      displayExistingSources();
      getJson(url, (json) => {
        newRow['title'] = json.name;
        displayExistingSources();
        updateBookmarks(json);
        chrome.storage.sync.set({'bookmarkSources': sources})
      });
    }
  }

  addButton.addEventListener('click', addSource);
});
