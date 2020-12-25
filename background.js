chrome.runtime.onInstalled.addListener(function () {
  chrome.alarms.create({periodInMinutes: 0.1});
});
chrome.alarms.onAlarm.addListener(function () {
  console.log('Hello Alarms!');
  loadSources((sources) => {
    for (var i = 0; i< sources.length; i++) {
      var source = sources[i];
      getJson(source.url, (json) => {
        source['title'] = json.name;
        saveSources(sources);
        synchronizeBookmarkSource(json);
      });
    }
  });
});
