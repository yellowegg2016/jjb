(function ($) {
  $.each(['show', 'hide'], function (i, ev) {
    var el = $.fn[ev];
    $.fn[ev] = function () {
      this.trigger(ev);
      return el.apply(this, arguments);
    };
  });
})(jQuery);

let checkinTasks = ['jr-index', 'jr-qyy', 'vip']

$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var messages = JSON.parse(localStorage.getItem('jjb_messages'))
  var login = localStorage.getItem('jjb_logged-in');
  var paid = localStorage.getItem('jjb_paid');
  var account = localStorage.getItem('jjb_account');
  var browser = localStorage.getItem('browserName');
  var disabled_link = localStorage.getItem('disabled_link');
  var unreadCount = localStorage.getItem('unreadCount') || 0

  if (unreadCount > 0) {
    $("#unreadCount").text(unreadCount).fadeIn()
  }

  $("#renderFrame").attr('src', '/render.html')
  
  if (login && login == 'Y') {
    $("#loginNotice").hide()
    
    if (paid) {
      $("#dialogs").hide()
    } else {
      let time = Date.now().toString()
      if (time[time.length - 1] < 3) {
        showReward()
      }
    }
  } else {
    $("#loginNotice").show()
  }

  if (!account) {
    $("#clearAccount").addClass('weui-btn_disabled')
  }

  // 标记签到状态
  checkinTasks.forEach(task => {
    let record = localStorage.getItem('jjb_checkin_' + task) ? JSON.parse(localStorage.getItem('jjb_checkin_' + task)) : null
    if (record && record.date == moment().format("DDD")) {
      let title = '完成于：' + moment(record.time).locale('zh-cn').calendar()
      if (record.value) {
        title = title + '，领到：' + record.value
      }
      $(".checkin-" + task).find('.reload-icon').hide()
      $(".checkin-" + task).find('.today').attr('title', title).show()
    }
  });
  

  function switchWechat(target) {
    console.log('switchWechat', target)
    let to = target || ($("#dialogs .weixin_pay .ming").is(':visible') ? 'samedi' : 'ming')
    if (to == 'samedi') {
      $("#dialogs .weixin_pay .ming").hide()
      $("#dialogs .weixin_pay .samedi").show()
    } else {
      $("#dialogs .weixin_pay .ming").show()
      $("#dialogs .weixin_pay .samedi").hide()
    }
  }

  function switchAlipay(target) {
    let to = target || ($("#dialogs .alipay_pay .alipay").is(':visible') ? 'redpack' : 'alipay')
    if (to == 'redpack') {
      console.log('show redpack')
      $("#dialogs .alipay_pay .alipay").hide()
      $("#dialogs .alipay_pay .redpack").show()
    } else {
      console.log('show alipay')
      $("#dialogs .alipay_pay .redpack").hide()
      $("#dialogs .alipay_pay .alipay").show()
    }
  }

  function showReward(target){
    $("#dialogs").show()
    switchWechat(target)
    switchAlipay()
    let time = Date.now().toString()
    if (time[time.length - 1] < 5 && !target) {
      setTimeout(() => {
        $("#payMethod-alipay").trigger('click')
      }, 50);
    }
  }

  function switchPayMethod(payMethod) {
    if (payMethod == 'weixin') {
      $('.weixin_pay').show()
      $('.alipay_pay').hide()
    } else {
      $('.weixin_pay').hide()
      $('.alipay_pay').show()
    }
  }

  if (!browser) {
    // tippy
    setTimeout(function () {
      tippy('.tippy', {
        animation: 'scale',
        duration: 20,
        arrow: true
      })
    }, 800)
  }


  $('.settings .weui-navbar__item').on('click', function () {
    $(this).addClass('weui-bar__item_on').siblings('.weui-bar__item_on').removeClass('weui-bar__item_on');
    var type = $(this).data('type')
    $('.settings_box').hide()
    $('.settings_box.' + type).show()
  });


  $('.contents .weui-navbar__item').on('click', function () {
    $(this).addClass('weui-bar__item_on').siblings('.weui-bar__item_on').removeClass('weui-bar__item_on');
    var type = $(this).data('type')
    if (type == 'messages') {
      $("#unreadCount").fadeOut()
      chrome.runtime.sendMessage({
        text: "clearUnread"
      }, function (response) {
        console.log("Response: ", response);
      });
    }
    $('.contents-box').hide()
    $('.contents-box.' + type).show()
  });

  if (orders) {
    orders = orders.map(function (order) {
      order.time = moment(order.time).locale('zh-cn').calendar()
      return order
    })
  } else {
    orders = []
  }

  if (messages) {
    messages = messages.reverse().map(function (message) {
      if (message.type == 'coupon') {
        message.coupon = JSON.parse(message.content)
      }
      message.time = moment(message.time).locale('zh-cn').calendar()
      return message
    })
  } else {
    messages = []
  }

  var bindAction = function () {
    $('.messages-header .Button').on('click', function () {
      let type = $(this).data('type')
      $('.messages-header .Button').removeClass('selectedTab')
      $(this).addClass('selectedTab')
      $('.message-items .message-item').hide()
      $('.message-items').find('.type-' + type).show()
    });
  }

  var renderFrame = document.getElementById('renderFrame');
 
  if (orders && orders.length > 0) {
    setTimeout(() => {
      renderFrame.contentWindow.postMessage({
        command: 'render',
        context: {
          name: 'orders',
          orders: orders,
          disabled_link: disabled_link == 'checked' ? true : false
        }
      }, '*');
    }, 200);
  }

  if (messages && messages.length > 0) {
    setTimeout(() => {
      renderFrame.contentWindow.postMessage({
        command: 'render',
        context: {
          name: 'messages',
          messages: messages
        }
      }, '*');
    }, 700);
  }

  function receiveMessage(event) {
    if (event.data.html) {
      switch (event.data.name) {
        case 'orders':
          $('#orders').html(event.data.html)
          break;
        case 'messages':
          $('#messages').html(event.data.html)
          bindAction()
          break;
        default:
          break;
      }
    }
  }
  window.addEventListener('message', receiveMessage, false)

  $(".weui-cell_select").each(function () {
    var job_elem = $(this)
    if (job_elem) {
      var jobId = job_elem.attr('id')
      if (jobId) {
        var last_run_time = localStorage.getItem(jobId + '_lasttime')
        if (last_run_time) {
          job_elem.find('.reload-icon').attr('title', '上次运行： '+ moment(Number(last_run_time)).locale('zh-cn').calendar())
        } else {
          job_elem.find('.reload-icon').attr('title', '从未执行')
        }
      }
    }
  })

  $(".weui-dialog input[name='payMethod']" ).change(function() {
    var payMethod = $(this).val()
    switchPayMethod(payMethod)
  });


  $(".weui-dialog__ft a").on("click", function () {
    $("#dialogs").hide()
    $("#listenAudio").hide()
    $("#loginNotice").hide()
    $("#changeLogs").hide()
    if ($(this).data('action') == 'paid') {
      chrome.runtime.sendMessage({
        text: "paid"
      }, function(response) {
        console.log("Response: ", response);
      });
    } else {
      if ($(this).data('action') == 'pay') {
        showReward()
      }
    }
  })

  $("#listen").on("click", function () {
    $("#listenAudio").show()
  })

  $(".payReward").on("click", function () {
    let target = $(this).data('target')
    showReward(target)
  })

  $(".alipay_pay .switch").on("click", function () {
    let to = $(this).data('to')
    switchAlipay(to)
  })
  
  $(".reward").on("click", function () {
    let to = $(this).data('to')
    switchWechat(to)
  })

  $("#showChangeLog").on("click", function () {
    $("#changeLogs").show()
  })

  $("#openFeedback").on("click", function () {
    // 加载反馈
    if ($("#feedbackIframe").attr('src') == '') {
      $("#feedbackIframe").attr('src', "https://i.duotai.net/forms/yovwz")
      setTimeout(function () {
        $('.iframe-loading').hide()
      }, 800)
    }
    $("#feedbackDialags").show()
  })

  $("#feedbackDialags .js-close").on("click", function () {
    $("#feedbackDialags").hide()
  })

  $(".reload").on("click", function () {
    var job_elem = $(this).parent().parent()

    if (job_elem) {
      chrome.runtime.sendMessage({
        text: "runJob",
        content: job_elem.attr('id')
      }, function(response) {
        console.log("Response: ", response);
      });
    }
  })

  $("#clearAccount").on("click", function () {
    localStorage.removeItem('jjb_account')
    chrome.tabs.create({
      url: "https://passport.jd.com/uc/login"
    })
  })
  

  $("#login").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  })

  var rewards = [
    '给开发者加个鸡腿',
    '请开发者喝杯咖啡',
    '京价保就是好',
    '保价成功，感谢开发者',
    '返利到手，打赏开发者',
    '赞赏支持'
  ]

  var notices = [
    {
      text: '成功申请到价保、领取到返利或者有功能建议欢迎打赏附言。',
      button: rewards[3]
    },
    {
      text: '理想情况下京价保每月仅各种签到任务即可带来5元以上的等同现金收益。',
      button: rewards[2]
    },
    {
      text: '京东页面经常修改，唯有你的支持才能让京价保保持更新持续运作。',
      button: rewards[5]
    },
    {
      text: '京价保所有的功能均在本地完成，不会上传任何信息给任何人。',
      button: rewards[5]
    },
    {
      text: '京价保部分功能会开启一个固定的标签页，过一会儿它会自动关掉，不必紧张。',
      button: rewards[1]
    },
    {
      text: '京东的登录有效期很短，请在登录时勾选保存密码自动登录以便京价保自动完成工作。',
      button: rewards[0]
    },
    {
      text: '京价保全部代码已上传到GitHub，欢迎审查代码，了解京价保如何工作。',
      button: rewards[0]
    },
    {
      text: '软件开发需要开发者付出劳动和智慧，每一行代码都要付出相应的工作，并非唾手可得。',
      button: rewards[5]
    },
    {
      text: '京价保并不强制付费，但如果它确实帮到你，希望你也能帮助它保持更新。',
      button: rewards[5]
    },
    {
      text: '许多开源项目因为缺乏支持而停止更新，如果你希望京价保保持更新，请赞赏支持。',
      button: rewards[5]
    },
    {
      text: '如果每个京价保的用户都能每个月赞赏5元，开发者就能投入更多时间维护京价保，增加更多实用功能。',
      button: rewards[5]
    },
    {
      text: '把京价保推荐给你的朋友同样能帮助京价保保持更新，如果缺乏使用者，开发者可能会放弃维护项目。',
      button: rewards[2]
    },
  ]

  function changeNotice() {
    let notice = notices[Math.floor(Math.random() * notices.length)]
    $("#notice").text(notice.text)
    $(".tips .payReward").text(notice.button)
  }
  
  $("#notice").on("dblclick", function () {
    changeNotice()
  })

  $("#pricePro").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openPricePro"
    }, function (response) {
      console.log("Response: ", response);
    })
  })

  $(".listenVoice").on("click", function () {
    listenVoice($(this).data('type'), $(this).data('batch'))
  })

  // 体验通知
  function listenVoice(type, batch) {
    chrome.runtime.sendMessage({
      text: type,
      batch: batch,
      test: true,
      title: "【试听】京价保通知试听",
      content: "并没有钱，这只是假象，你不要太当真"
    }, function (response) {
      console.log("Response: ", response);
    });
  }
})
