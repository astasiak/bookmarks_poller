
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

function createBookmark(bookmark, parentId) {
  if (bookmark.url) {  
    chrome.bookmarks.create({'parentId': parentId, 'title': bookmark.name, 'url': bookmark.url});
  } else if (bookmark.folder) {
    chrome.bookmarks.create({'parentId': parentId, 'title': bookmark.name}, (bookmarkTreeNode) => {
      for (var i = 0; i < bookmark.folder.length; i++) {
        createBookmark(bookmark.folder[i], bookmarkTreeNode.id);
      }
    });
  }
}

function fillSourceBookmarkId(source, callback) {
  function createBookmarkFolder(callback) {
    chrome.bookmarks.create({'parentId': '1', 'title': source.title}, (bookmarkTreeNode) => {
      callback(bookmarkTreeNode.id);
    });
  }
  if (source.bookmarkId) {
    chrome.bookmarks.get(source.bookmarkId, (bookmark) => {
      if (!bookmark) {
        var oldBookmarkId = source.bookmarkId;
        createBookmarkFolder((bookmarkId) => {
          source.bookmarkId = bookmarkId;
          updateSource(oldBookmarkId, source, () => {
            callback(source);
          });
        });
      } else {
        callback(source);
      }
    });
  } else {
    createBookmarkFolder((bookmarkId) => {
      source.bookmarkId = bookmarkId;
      insertSource(source, () => {
        callback(source);
      });
    });
  }
}

function createBookmarksFromSource(source, callback) {
  getJson(source.url, (sourceData) => {
    source.title = sourceData.name;
    fillSourceBookmarkId(source, (source) => {
      chrome.bookmarks.getSubTree(source.bookmarkId, (bookmarkTreeNode) => {
        for (existingBookmark of bookmarkTreeNode[0].children) {
          chrome.bookmarks.removeTree(existingBookmark.id);
        }
        if (sourceData.folder) {
          for (newBookmark of sourceData.folder) {
            createBookmark(newBookmark, source.bookmarkId);
          }
        }
        if (callback) {
          callback();
        }
      });
    });
  });
}

function loadSources(callback) {
  chrome.storage.sync.get(['bookmarkSources'], function(storedValue) {
    var result = storedValue['bookmarkSources'] || [];
    callback(result);
  });
}

function saveSources(sources, callback) {
  chrome.storage.sync.set({'bookmarkSources': sources}, callback);
}

function updateSource(sourceId, newSource, callback) {
  loadSources((sources) => {
    var index = sources.findIndex((source) => source.bookmarkId == sourceId);
    sources[index] = newSource;
    saveSources(sources, callback);
  });
}

function insertSource(newSource, callback) {
  loadSources((sources) => {
    sources.push(newSource);
    saveSources(sources, callback);
  });
}
