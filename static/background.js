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
    title: '京东金融签到',
    mode: 'iframe',
    frequency: 'daily'
  },
  {
    id: '7',
    src: 'https://passport.jd.com/new/login.aspx?ReturnUrl=https://bean.jd.com/myJingBean/list',
    title: '店铺签到',
    mode: 'tab',
    frequency: 'daily'
  },
  {
    id: '8',
    src: 'https://plogin.m.jd.com/user/login.action?appid=100&returnurl=https%3a%2f%2fhome.jdpay.com%2fmy%2fsignIndex%3ffrom%3ddxjg%26source%3dJDSC',
    title: '京东支付签到',
    mode: 'iframe',
    frequency: 'daily'
  }
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
      console.log("京价宝安装成功！");
    });
  }
});


chrome.alarms.onAlarm.addListener(function( alarm ) {
  switch(true){
    // 定时检查任务
    case alarm.name.startsWith('delayIn'):
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
function run(jobId) {
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
  if (job) {
    console.log("运行", job.title)
    if (job.mode == 'iframe') {
      $("#iframe").attr('src', job.src)
    } else {
      chrome.tabs.create({
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
})

// 点击通知
chrome.notifications.onClicked.addListener(function (notificationId){
  if (notificationId.split('_').length > 0) {
    var batch = notificationId.split('_')[1]
    if (batch && batch.length > 0) {
      switch(batch){
        case 'baitiao':
          chrome.tabs.create({
            url: "http://vip.jr.jd.com/coupon/myCoupons?default=IOU"
          })
          break;
        case 'jiabao':
          chrome.windows.create({
            width: 420,
            height: 800,
            url: "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fpriceProPhoneMenu",
            type: "popup"
          });
          break;
        default:
          chrome.tabs.create({
            url: "http://search.jd.com/Search?coupon_batch="+batch
          })
      }
    }
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
      chrome.windows.create({
        width: 420,
        height: 800,
        url: "https://plogin.m.jd.com/user/login.action?appid=100&kpkey=&returnurl=https%3a%2f%2fsitepp-fm.jd.com%2frest%2fpriceprophone%2fpriceProPhoneMenu",
        type: "popup"
      });
      break;
    case 'option':
      localStorage.setItem('jjb_'+msg.title, msg.content);
      console.log('option', msg)
      break;
    case 'runJob':
      var jobId = msg.content.split('job')[1]
      var jobList = getJobs()
      var job = _.find(jobList, {id: jobId})
      run(jobId)
      chrome.notifications.create( new Date().getTime().toString(), {
        type: "basic",
        title: "正在重新运行" + job.title,
        message: "如果有情况我再叫你",
        iconUrl: 'static/image/128.png'
      })
      break;
    case 'notice':
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
        index: content.index,
        url: content.url,
        active: content.active == 'true',
        pinned: content.pinned == 'true'
      }, function (tab) {
        chrome.alarms.create('closeTab_'+tab.id, {delayInMinutes: 1})
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