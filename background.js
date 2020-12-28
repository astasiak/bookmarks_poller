chrome.runtime.onInstalled.addListener(function () {
  chrome.alarms.create({periodInMinutes: 3});
});
chrome.alarms.onAlarm.addListener(function () {
  loadSources((sources) => {
    for (source of sources) {
      createBookmarksFromSource(source);
    }
  });
});
