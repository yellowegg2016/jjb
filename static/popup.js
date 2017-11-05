$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var login = localStorage.getItem('jjb_logged-in');
  var paid = localStorage.getItem('jjb_paid');
  if (login && login == 'Y') {
    $("#login").hide()
  } else {
    $("#login").show()
  }

  if (paid) {
    $("#dialogs").hide()
  } else {
    $("#dialogs").show()
  }

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
      orders: orders
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

  $("#login").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  })
  var notices = [
    '成功申请到价保、功能建议欢迎打赏附言。',
    '京价宝并非免费插件，请您打赏任意金额获得使用授权。',
    '理想情况下京价宝每月仅各种签到任务即可带来5元以上的等同现金收益。',
    '京东页面经常更新，唯有你的支持才能让京价宝保持更新。',
    '京价宝所有的功能均在本地完成，不会上传任何信息给任何人。',
    '京价宝部分功能会开启一个固定的标签页，过一会儿它会自动关掉，不必紧张。',
    '京价宝没有包含任何广告代码，你的打赏是开发者的唯一收入。',
    '京东的登录有效期很短，请在登录时勾选保存密码自动登录以便京价宝自动完成工作。',
    '京价宝全部代码已上传到GitHub，欢迎审查代码。',
  ]
  $("#notice").text(notices[Math.floor(Math.random() * notices.length)])

  $("#pricePro").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openPricePro",
    }, function (response) {
      console.log("Response: ", response);
    });
  })
})
