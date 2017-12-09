$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var login = localStorage.getItem('jjb_logged-in');
  var paid = localStorage.getItem('jjb_paid');
  var account = localStorage.getItem('jjb_account');
  var browser = localStorage.getItem('browserName');
  var disabled_link = localStorage.getItem('disabled_link');
  
  if (login && login == 'Y') {
    $("#login").hide()
    
    if (paid) {
      $("#dialogs").hide()
    } else {
      let time = Date.now().toString()
      if (time[time.length - 1] < 3) {
        $("#dialogs").show()
      }
    }
  } else {
    $("#login").show()
  }

  if (!account) {
    $("#clearAccount").addClass('weui-btn_disabled')
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


  $('.weui-navbar__item').on('click', function () {
    $(this).addClass('weui-bar__item_on').siblings('.weui-bar__item_on').removeClass('weui-bar__item_on');
    var type = $(this).data('type')
    $('.settings_box').hide()
    $('.' + type).show()
  });

  if (orders) {
    orders = orders.map(function (order) {
      order.time = moment(order.time).locale('zh-cn').calendar()
      return order
    })
  } else {
    orders = []
  }
 
  if (orders) {
    var orders_html = template('tpl-orders', {
      orders: orders,
      disabled_link: disabled_link == 'checked' ? true : false
    });
    $('.orders').html(orders_html)
  }

  $(".weui-cell_select").each(function () {
    var job_elem = $(this)
    if (job_elem) {
      var jobId = job_elem.attr('id')
      if (jobId) {
        var last_run_time = localStorage.getItem(jobId + '_lasttime')
        if (last_run_time) {
          job_elem.find('.reload').attr('title', '上次运行： '+ moment(Number(last_run_time)).locale('zh-cn').calendar())
        } else {
          job_elem.find('.reload').attr('title', '从未执行')
        }
      }
    }
  })

  $(".weui-dialog input[name='payMethod']" ).change(function() {
    var payMethod = $(this).val()
    if (payMethod == 'weixin') {
      $('.weixin_pay').show()
      $('.alipay_pay').hide()
    } else {
      $('.weixin_pay').hide()
      $('.alipay_pay').show()
    }
  });


  $(".weui-dialog__ft a").on("click", function () {
    $("#dialogs").hide()
    $("#changeLogs").hide()
    if ($(this).data('action') == 'paid') {
      chrome.runtime.sendMessage({
        text: "paid"
      }, function(response) {
        console.log("Response: ", response);
      });
    } else {
      if ($(this).data('action') == 'pay') {
        $("#dialogs").show()
      }
    }
  })


  $("#pay").on("click", function () {
    $("#dialogs").show()
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
  var notices = [
    '成功申请到价保、功能建议欢迎打赏附言。',
    '理想情况下京价保每月仅各种签到任务即可带来5元以上的等同现金收益。',
    '京东页面经常更新，唯有你的支持才能让京价保保持更新。',
    '京价保所有的功能均在本地完成，不会上传任何信息给任何人。',
    '京价保部分功能会开启一个固定的标签页，过一会儿它会自动关掉，不必紧张。',
    '京东的登录有效期很短，请在登录时勾选保存密码自动登录以便京价保自动完成工作。',
    '京价保全部代码已上传到GitHub，欢迎审查代码。',
  ]
  var rewards = [
    '给开发者加个鸡腿',
    '请开发者喝杯咖啡',
    '京价保就是好',
    '保价成功，感谢开发者',
    '返利到手，打赏开发者',
  ]

  $("#notice").text(notices[Math.floor(Math.random() * notices.length)])
  $("#pay").text(rewards[Math.floor(Math.random() * rewards.length)])

  $("#pricePro").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openPricePro",
    }, function (response) {
      console.log("Response: ", response);
    });
  })
})
