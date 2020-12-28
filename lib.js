
function getJson(url, callback, handleError) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        try {
          var json = JSON.parse(xmlHttp.responseText);
        } catch(error) {
          handleError();
        }
        callback(json);
      } else {
        handleError();
      }
    }
  };
  xmlHttp.open("GET", url, true);
  xmlHttp.send(null);
}

function checkBookmarkExists(bookmarkId, callback) {
  function containsBookmark(node) {
    if (node.id == bookmarkId) {
      return true;
    }
    if (node.children) {
      for (child of node.children) {
        if(containsBookmark(child)) {
          return true;
        }
      }
    }
    return false;
  }
  chrome.bookmarks.getSubTree('1', (trees) =>  {
    callback(containsBookmark(trees[0]));
  });
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

function removeBookmark(bookmarkId) {
  chrome.bookmarks.removeTree(bookmarkId);
}

function fillSourceBookmarkId(source, callback) {
  function createBookmarkFolderAndCallBack() {
    chrome.bookmarks.create({'parentId': '1', 'title': source.title}, (bookmarkTreeNode) => {
      source.bookmarkId = bookmarkTreeNode.id;
      upsertSource(source, () => {
        callback(source);
      });
    });
  }
  if (source.bookmarkId) {
    checkBookmarkExists(source.bookmarkId, (bookmarkFound) => {
      if (bookmarkFound) {
        callback(source);
      } else {
        createBookmarkFolderAndCallBack();
      }
    });
  } else {
    createBookmarkFolderAndCallBack();
  }
}

function createBookmarksFromSource(source, callback) {
  function markError() {
    source.error = true;
    upsertSource(source, callback);
  }
  getJson(source.url, (sourceData) => {
    if (!sourceData || !sourceData.name) {
      markError();
      return;
    }
    source.title = sourceData.name;
    source.error = false;
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
  }, () => {
    markError();
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

function upsertSource(source, callback) {
  loadSources((sources) => {
    var index = sources.findIndex((s) => s.id == source.id);
    if (!source.id || index == -1) {
      source.id = Date.now();
      sources.push(source);
    } else {
      sources[index] = source;
    }
    saveSources(sources, () => {
      if (callback) {
        callback(source);
      }
    });
  });
}
