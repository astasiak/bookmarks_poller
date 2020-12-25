var sources = []

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

function processBookmarkSource(source, callback) {
  getJson(source.url, (json) => {
    source['title'] = json.name;
    updateBookmarks(json);
    chrome.storage.sync.set({'bookmarkSources': sources});
    if (callback) {
      callback();
    }
  });
}
