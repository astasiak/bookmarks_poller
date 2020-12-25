
document.addEventListener('DOMContentLoaded', function() {
  var updateButton = document.getElementById('updateBookmarks');
  var urlInput = document.getElementById('urlInput');

  
  function getJson() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            updateBookmarks(xmlHttp.responseText);
    };
    xmlHttp.open("GET", urlInput.value, true);
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
    var json = JSON.parse(response);
    var managedBookmarks = json['bookmarks'];
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

  chrome.storage.sync.get(['bookmarksUrl'], function(result) {
    urlInput.value = result['bookmarksUrl'];
  });
  updateButton.addEventListener('click', function() {
    chrome.storage.sync.set({'bookmarksUrl': urlInput.value});
    getJson();
  });
});
