chrome.runtime.onInstalled.addListener(function () {
  //chrome.alarms.create({periodInMinutes: 1});
});
chrome.alarms.onAlarm.addListener(function () {
  console.log('Hello Alarms!');
  loadSources((sources) => {
    for (source of sources) {
      createBookmarksFromSource(source);
    }
  });
});
