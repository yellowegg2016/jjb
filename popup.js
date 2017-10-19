$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var last_check = localStorage.getItem('jjb_last_check')
  var login = localStorage.getItem('jjb_logged-in');
  var paid = localStorage.getItem('jjb_paid');
  if (login) {
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
  if (last_check) {
    $('.last_check').show()
    $('#last_check').text(moment(last_check).locale('zh-cn').calendar())
  } else {
    $('.last_check').hide()
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
        job_elem.find('.reload').attr('title', '上次运行： '+ moment(Number(last_run_time)).locale('zh-cn').calendar())
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
    if ($(this).data('action') == 'paid') {
      chrome.runtime.sendMessage({
        text: "paid"
      }, function(response) {
        console.log("Response: ", response);
      });
    } else {

    }
    $("#dialogs").hide()
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
})
