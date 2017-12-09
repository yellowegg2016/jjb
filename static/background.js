let jobs = [
  {
    id: '1',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fpriceProPhoneMenu',
    title: '价格保护',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '2',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fcoupon.m.jd.com%2Fcenter%2FgetCouponCenter.action',
    title: '领精选券',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '3',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fplus.m.jd.com%2Findex',
    title: 'PLUS券',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '4',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fm.jr.jd.com%2fjdbt%2fnewcoupons%2fcoupon-list.html%3fcategory%3d0%26coupony%3d0',
    title: '领白条券',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '5',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3A%2F%2Fvip.m.jd.com%2Fpage%2Fhome',
    title: '京豆签到',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '6',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fm.jr.jd.com%2fspe%2fqyy%2fmain%2findex.html%3fuserType%3d41',
    title: '京东金融惠赚钱签到',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '7',
    src: 'https://passport.jd.com/new/login.aspx?ReturnUrl=https://bean.jd.com/myJingBean/list',
    title: '店铺签到',
    mode: 'tab',
    frequency: 'never'
  },
  {
    id: '8',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&returnurl=https%3a%2f%2fhome.jdpay.com%2fmy%2fsignIndex%3ffrom%3ddxjg%26source%3dJDSC',
    title: '京东支付签到',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '9',
    src: 'https://passport.jd.com/new/login.aspx?ReturnUrl=https%3a%2f%2fvip.jr.jd.com%2f',
    title: '京东金融会员签到',
    mode: 'tab',
    frequency: 'daily'
  },
  {
    id: '10',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&returnurl=https%3a%2f%2fm.jr.jd.com%2fmjractivity%2frn%2fplatinum_members_center%2findex.html%3fpage%3dFXDetailPage',
    title: '金融铂金会员支付返利',
    mode: 'iframe',
    frequency: 'daily'
  },
]


let mapFrequency = {
  '2h': 2 * 60,
  '5h': 5 * 60,
  'daily': 12 * 60,
  'never': 99999
}

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
        urls: ['*://*.jd.com/*', '*://*.jd.hk/*', "*://*.jdpay.com/*"], //
        types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
);

chrome.runtime.onInstalled.addListener(function (object) {
  var installed = localStorage.getItem('jjb_installed')
  if (installed) {
    console.log("已经安装")
  } else {
    localStorage.setItem('jjb_installed', 'Y');
    chrome.tabs.create({url: "/start.html"}, function (tab) {
      console.log("京价保安装成功！");
    });
  }
});

// 判断浏览器
try {
  browser.runtime.getBrowserInfo().then(function (browserInfo) {
    localStorage.setItem('browserName', browserInfo.name);
  })
} catch (error) {}


chrome.alarms.onAlarm.addListener(function( alarm ) {
  switch(true){
    // 定时检查任务
    case alarm.name.startsWith('delayIn'):
      clearDiscardableTabs()
      findJobs()
      run()
      break;
    case alarm.name.startsWith('runJob'):
      var jobId = alarm.name.split('_')[1]
      run(jobId)
      break;
    case alarm.name.startsWith('closeTab'):
      var tabId = alarm.name.split('_')[1]
      try {
        chrome.tabs.remove(parseInt(tabId))
      } catch (e) {}
      break;
    case alarm.name == 'reload':
      chrome.runtime.reload()
      break;
  }
})

// 保存任务栈
function saveJobStack(jobStack) {
  jobStack = _.uniq(jobStack)
  localStorage.setItem('jobStack', JSON.stringify(jobStack));
}


function getJobs() {
  return _.map(jobs, (job) => {
    var job_run_last_time = localStorage.getItem('job' + job.id + '_lasttime')
    job.last_run_at = job_run_last_time ? parseInt(job_run_last_time) : null
    job.frequency = localStorage.getItem('job' + job.id + '_frequency') || job.frequency
    return job
  })
}


// 寻找乔布斯
function findJobs() {
  var jobStack = localStorage.getItem('jobStack') ? JSON.parse(localStorage.getItem('jobStack')) : []
  var jobList = getJobs()
  jobList.forEach(function(job) {
    switch(job.frequency){
      case '2h':
        // 如果从没运行过，或者上次运行已经过去超过2小时，那么需要运行
        if (!job.last_run_at || moment().isAfter(moment(job.last_run_at).add(2, 'hour')) ) {
          jobStack.push(job.id)
        }
        break;
      case '5h':
        // 如果从没运行过，或者上次运行已经过去超过5小时，那么需要运行
        if (!job.last_run_at || moment().isAfter(moment(job.last_run_at).add(5, 'hour')) ) {
          jobStack.push(job.id)
        }
        break;
      case 'daily':
        // 如果从没运行过，或者上次运行不在今天
        if ( !job.last_run_at || !moment().isSame(moment(job.last_run_at), 'day') ) {
          jobStack.push(job.id)
        }
        break;
      default:
        console.log('ok, never run ', job.title)
    }
  });
  saveJobStack(jobStack)
}

// 执行组织交给我的任务
function run(jobId, force) {
  console.log("run", jobId, new Date())
  // 如果没有指定任务ID 就从任务栈里面找一个
  if (!jobId) {
    var jobStack = localStorage.getItem('jobStack') ? JSON.parse(localStorage.getItem('jobStack')) : []
    if (jobStack && jobStack.length > 0) {
      var jobId = jobStack.shift();
      saveJobStack(jobStack)
    } else {
      console.log('好像没有什么事需要我做...')
    }
  }
  var jobList = getJobs()
  var job = _.find(jobList, {id: jobId})
  if (job && (job.frequency != 'never' || force)) {
    console.log("运行", job.title)
    if (job.mode == 'iframe') {
      $("#iframe").attr('src', job.src)
    } else {
      chrome.tabs.create({
        autoDiscardable: true,
        index: 1,
        url: job.src,
        active: false,
        pinned: true
      }, function (tab) {
        chrome.alarms.create('closeTab_'+tab.id, {delayInMinutes: 3})
      })
    }
    var last_run_at = localStorage.setItem('job' + job.id + '_lasttime', new Date().getTime())
    // 安排下一次运行
    if (mapFrequency[job.frequency] < 1000) {
      chrome.alarms.create('runJob_'+job.id, {
        delayInMinutes: mapFrequency[job.frequency]
      })
    }
  }

}

$( document ).ready(function() {
  // 每10分钟运行一次定时任务
  chrome.alarms.create('delayInMinutes', {periodInMinutes: 10})

  // 每600分钟完全重载
  chrome.alarms.create('reload', {periodInMinutes: 600})

  // 载入后马上运行一次任务查找
  findJobs()

  // 总是安全的访问京东
  var force_https = localStorage.getItem('force_https')
  if (force_https && force_https == 'checked') {
    chrome.tabs.onCreated.addListener(function (tab){
      forceHttps(tab)
    })
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      forceHttps(tab)
    })
  }
})

// 点击通知
chrome.notifications.onClicked.addListener(function (notificationId){
  if (notificationId.split('_').length > 0) {
    var batch = notificationId.split('_')[1]
    if (batch && batch.length > 1) {
      switch(batch){
        case 'baitiao':
          chrome.tabs.create({
            autoDiscardable: true,
            url: "https://vip.jr.jd.com/coupon/myCoupons?default=IOU"
          })
          break;
        case 'bean':
          chrome.tabs.create({
            autoDiscardable: true,
            url: "http://bean.jd.com/myJingBean/list"
          })
          break;
        case 'jiabao':
          openPriceProPhoneMenu()
          break;
        case 'jrfx':
          openFXDetailPage()
          break;
        default:
          chrome.tabs.create({
            autoDiscardable: true,
            url: "https://search.jd.com/Search?coupon_batch="+batch
          })
      }
    }
  }
})

function openPriceProPhoneMenu() {
  chrome.windows.create({
    width: 420,
    height: 800,
    url: "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fpriceProPhoneMenu",
    type: "popup"
  });
}

function openFXDetailPage() {
  chrome.windows.create({
    width: 420,
    height: 800,
    url: "https://plogin.m.jd.com/user/login.action?appid=100&returnurl=https%3a%2f%2fm.jr.jd.com%2fmjractivity%2frn%2fplatinum_members_center%2findex.html%3fpage%3dFXDetailPage",
    type: "popup"
  });
}

// force ssl
function forceHttps(tab) {
  if (tab && _.startsWith(tab.url, 'http://') && tab.url.indexOf('jd.com') !== -1) {
    chrome.tabs.update(tab.id, {
      url: tab.url.replace(/^http:\/\//i, 'https://')
    }, function () {
      console.log('force ssl jd.com')
    })
  }
}

// 清除不需要的tab
function clearDiscardableTabs() {
  chrome.tabs.query({
    autoDiscardable: 'true',
    pinned: 'true'
  }, function (tabs) {
    var tabIds = $.map(tabs, function (tab) {
      if (tab && tab.url.indexOf('jd.com') !== -1) {
        return tab.id
      }
    })
    chrome.tabs.remove(tabIds)
  })
}


chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  switch(msg.text){
    case 'isLogin':
      localStorage.setItem('jjb_logged-in', 'Y');
      break;
    case 'saveAccount':
      var content = JSON.parse(msg.content)
      if (content.username && content.password) {
        localStorage.setItem('jjb_account', msg.content);
      }
      break;
    case 'getSetting':
      var setting = localStorage.getItem(msg.content)
      return sendResponse(setting)
      break;
    case 'getAccount':
      var account = localStorage.getItem('jjb_account')
      return sendResponse(account)
      break;
    case 'paid':
      localStorage.setItem('jjb_paid', 'Y');
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: "谢谢老板",
        message: "我会努力签到、领券、申请价格保护来回报你的",
        iconUrl: 'static/image/128.png'
      })
      break;
    case 'openLogin':
    case 'openPricePro':
      openPriceProPhoneMenu()
      break;
    case 'option':
      localStorage.setItem('jjb_'+msg.title, msg.content);
      console.log('option', msg)
      break;
    case 'runJob':
      var jobId = msg.content.split('job')[1]
      var jobList = getJobs()
      var job = _.find(jobList, {id: jobId})
      run(jobId, true)
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: "正在重新运行" + job.title,
        message: "如果有情况我再叫你",
        iconUrl: 'static/image/128.png'
      })
      break;
    case 'notice':
      if (msg.batch == 'jiabao') {
        var play_audio = localStorage.getItem('play_audio')
        var hide_good = localStorage.getItem('hide_good')
        if (play_audio && play_audio == 'checked') {
          var myAudio = new Audio();
          myAudio.src = "static/audio/diamond.ogg";
          myAudio.play();
        }
        if (hide_good && hide_good == 'checked') {
          msg.content = "具体成功没成功我也不清楚，你自己点开看看吧。"
        }
      }
      chrome.notifications.create( new Date().getTime().toString() + '_' + msg.batch, {
        type: "basic",
        title: msg.title,
        message: msg.content,
        iconUrl: 'static/image/128.png'
      })
      
      break;
    case 'checkin_notice':
      var mute_checkin = localStorage.getItem('mute_checkin')
      if (mute_checkin && mute_checkin == 'checked') {
        console.log('checkin', msg)
      } else {
        var play_audio = localStorage.getItem('play_audio')
        if (play_audio && play_audio == 'checked') {
          var myAudio = new Audio();
          myAudio.src = "static/audio/coin.mp3";
          myAudio.play();
        }
        chrome.notifications.create( new Date().getTime().toString() + '_' + msg.batch, {
          type: "basic",
          title: msg.title,
          message: msg.content,
          iconUrl: 'static/image/bean.png'
        })
      }
      break;
    case 'create_tab':
      var content = JSON.parse(msg.content)
      chrome.tabs.create({
        autoDiscardable: true,
        index: content.index,
        url: content.url,
        active: content.active == 'true',
        pinned: content.pinned == 'true'
      }, function (tab) {
        chrome.alarms.create('closeTab_' + tab.id, { delayInMinutes: 1 })
      })
      break;
    case 'remove_tab':
      var content = JSON.parse(msg.content)
      console.log('content', content)
      chrome.tabs.query({
        url: content.url,
        pinned: content.pinned == 'true'
      }, function (tabs) {
        console.log('tabs', tabs)
        var tabIds = $.map(tabs, function (tab) {
          return tab.id
        })
        console.log('tabIds', tabIds)
        chrome.tabs.remove(tabIds)
      })
      break;
    case 'coupon':
      var coupon = JSON.parse(msg.content)
      var mute_coupon = localStorage.getItem('mute_coupon')
      if (mute_coupon && mute_coupon == 'checked') {
        console.log('coupon', msg)
      } else {
        chrome.notifications.create( "coupon_" + coupon.batch, {
          type: "basic",
          title: msg.title,
          message: coupon.name + coupon.price,
          isClickable: true,
          iconUrl: 'static/image/coupon.png'
        })
      }
      break;
    case 'orders':
      localStorage.setItem('jjb_orders', msg.content);
      localStorage.setItem('jjb_last_check', new Date().getTime());
      break;
    default:
      console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  }
  sendResponse(msg, "Gotcha!");
});