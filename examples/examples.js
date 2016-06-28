function reload() {
  var iframe = $('iframe');
  var location = iframe.attr('src');
  iframe.attr('src', null);
  iframe.attr('src', location);
}

function htmlClicked() {
  $('#html-tab').addClass('active');
  $('#js-tab').removeClass('active');

  var htmlText = $('.html');
  $('.js').css('display', 'none');
  if (htmlText.css('display') === 'none') {
    htmlText.css('display', 'block');
  } else {
    $('#html-tab').removeClass('active');
    htmlText.css('display', 'none');
  }
}

function jsClicked(jsId, htmlId) {
  $('#js-tab').addClass('active');
  $('#html-tab').removeClass('active');

  var jsText = $('.js');
  $('.html').css('display', 'none');
  if (jsText.css('display') === 'none') {
    jsText.css('display', 'block');
  } else {
    $('#js-tab').removeClass('active');
    jsText.css('display', 'none');
  }
}

$(window).on('resize', onResize);

function onResize(){
  var w = $("body").innerWidth();
  var fontSize = w / 60.625; // 970/60.625 = 16
  $("body").css('font-size', fontSize + 'px');
}

$(document).ready(function() {
  onResize();
});
