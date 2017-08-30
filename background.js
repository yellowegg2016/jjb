// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
    function(info) {
      var headers = info.responseHeaders;
      var index = headers.findIndex(x=>x.name.toLowerCase() == "x-frame-options");
      if (index !=-1) {
        headers.splice(index, 1);
      }
      return {responseHeaders: headers};
    },
    {
        urls: ['*://*.jd.com/*'], //
        types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
);

console.log('京价宝启动成功！')

chrome.alarms.create('checkEveryDay', {periodInMinutes: 24*60})
chrome.alarms.onAlarm.addListener(function( alarm ) {
  console.log('reload', new Date())
  chrome.runtime.reload()
});

$( document ).ready(function() {
  $("#iframe1").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fprotect%3ftype%3d3&random=" + new Date().getTime())
})

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  switch(msg.text){
    case 'needLogin':
      chrome.windows.create({
        width: 420,
        height: 800,
        url: "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fprotect%3ftype%3d3&random=" + new Date().getTime(),
        type: "popup"
      });
      break;
    case 'notice':
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: msg.title,
        message: msg.content,
        iconUrl: 'coin.png'
      })
      break;
    case 'orders':
      localStorage.setItem('jjb_orders', msg.content);
      localStorage.setItem('jjb_last_check', new Date());
      break;
    default:
      console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  }
  sendResponse("Gotcha!");
});