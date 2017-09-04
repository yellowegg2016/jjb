$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var last_check = localStorage.getItem('jjb_last_check')
  var login = localStorage.getItem('jjb_logged-in');
  if (login) {
    $("#reload").show()
    $("#login").hide()
  } else {
    $("#reload").hide()
    $("#login").show()
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
  $("#reload").on("click", function () {
    chrome.runtime.sendMessage({
      text: "reload",
    }, function(response) {
      console.log("Response: ", response);
    });
  })

  $("#login").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  })
})
