// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
    function(info) {
      var headers = info.responseHeaders;
      for (var i=headers.length-1; i>=0; --i) {
          var header = headers[i].name.toLowerCase();
          if (header == 'x-frame-options' || header == 'frame-options') {
              headers.splice(i, 1); // Remove header
          }
      }
      return {responseHeaders: headers};
    },
    {
        urls: ['*://*.jd.com/*'], //
        types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
);

chrome.runtime.onInstalled.addListener(function (object) {
  var last_type = localStorage.getItem('jjb_type')
  if (last_type > 0) {
    console.log("已经安装")
  } else {
    chrome.tabs.create({url: "/start.html"}, function (tab) {
      console.log("京价宝安装成功！");
    });
  }
});

console.log('京价宝启动成功！')

chrome.alarms.create('checkEveryDay', {periodInMinutes: 2*60})
chrome.alarms.onAlarm.addListener(function( alarm ) {
  console.log('reload', new Date())
  chrome.runtime.reload()
});

$( document ).ready(function() {
  var last_type = localStorage.getItem('jjb_type') || 1
  var type = Number(last_type) + 1
  if (type > 6) {
    type = 1
  }
  localStorage.setItem('jjb_type', type)
  switch(type){
    case 1:
      console.log("价格保护")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fprotect%3ftype%3d3")
      break;
    case 2:
      console.log("自动领券")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fcoupon.m.jd.com%2Fcenter%2FgetCouponCenter.action")
      break;
    case 3:
      console.log("PLUS券")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fplus.m.jd.com%2Findex")
      break;
    case 4:
      console.log("自动签到")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fvip.m.jd.com%2Fpage%2Fhome")
      break;
    case 5:
      console.log("白条券")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fm.jr.jd.com%2fjdbt%2fnewcoupons%2fcoupon-list.html%3fcategory%3d0%26coupony%3d0")
      break;
    case 6:
      console.log("白赚")
      $("#iframe").attr('src', "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fbk.jd.com%2fm%2fchannel%2flogin%2fdaka.html")
      break;
    }
})

// 点击通知
chrome.notifications.onClicked.addListener(function (notificationId){
  if (notificationId.split('_')[1]) {
    chrome.tabs.create({
      url: "http://search.jd.com/Search?coupon_batch="+notificationId.split('_')[1]
    })
  }
})


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  switch(msg.text){
    case 'isLogin':
      localStorage.setItem('jjb_logged-in', 'Y');
      break;
    case 'notLogin':
      localStorage.setItem('jjb_logged-in', 'N');
      break;
    case 'openLogin':
      chrome.windows.create({
        width: 420,
        height: 800,
        url: "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fprotect%3ftype%3d3",
        type: "popup"
      });
      break;
    case 'option':
      localStorage.setItem('jjb_'+msg.title, msg.content);
      console.log('option', msg)
      break;
    case 'reload':
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: "正在重新运行检查..",
        message: "如果有情况我再叫你",
        iconUrl: 'coin.png'
      })
      chrome.runtime.reload()
      break;
    case 'notice':
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: msg.title,
        message: msg.content,
        iconUrl: 'coin.png'
      })
      break;
    case 'coupon':
      var coupon = JSON.parse(msg.content)
      var mute_coupon = localStorage.getItem('jjb_mute_coupon')
      if (mute_coupon && mute_coupon == 'true') {
        console.log('coupon', msg)
      } else {
        chrome.notifications.create( "coupon_" + coupon.batch, {
          type: "basic",
          title: msg.title,
          message: coupon.name + coupon.price,
          isClickable: true,
          iconUrl: 'coupon.png'
        })
      }
      break;
    case 'orders':
      localStorage.setItem('jjb_orders', msg.content);
      localStorage.setItem('jjb_last_check', new Date());
      break;
    default:
      console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  }
  sendResponse(msg, "Gotcha!");
});