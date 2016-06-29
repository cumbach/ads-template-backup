(function(){
  'use strict';

  $(window).on('resize', onResize);

  function onResize(){
      var w = $("body").innerWidth();
      var fontSize = w / 60.625; // 970/60.625 = 16
      $("body").css('font-size', fontSize + 'px');
  }

  $(document).ready(function() {
    onResize();
  });

  var RotatingText = function RotatingText(element) {
      this.element_ = element;
      this.textFill = [];
      this.textDelay = 2;
  };
  window['RotatingText'] = RotatingText;

  RotatingText.prototype.init = function(opts) {
    this.textDelay = (opts.textDelay ? opts.textDelay : this.textDelay);
  };

  RotatingText.prototype.addText = function(textFill) {
    this.textFill = textFill;
    var i = 0;
    var el;
    while (i < this.textFill.length) {
      el = document.createElement('div');
      el.className = 'text-line';
      el.id = "text-line" + i;
      el.innerHTML = this.textFill[i];
      this.element_.appendChild(el);
      i += 1;
    }
    this.flipText()
  };

  RotatingText.prototype.flipText = function() {
    var textTimelineTween = new TimelineLite();
    var textTimelineTween2 = new TimelineLite();
    var i = 1;
    while (i < this.textFill.length) {
        var t0 = "#text-line" + (i-1);
        var t1 = "#text-line" + (i);

        textTimelineTween.to(t0, .5, {delay: this.textDelay, top: '-2em'});
        textTimelineTween2.to(t1, .5, {delay: this.textDelay, top: 0});

        i = i + 1;
    }
  }



  var Spinner = function Spinner(element) {
      this.numImages = 12;
      this.spriteWidth = 7.7;
      // If spritesheet is even, set these vars to 0
      this.firstSpriteOffset = 0;
      this.nextSpritesOffset = 0;
      this.spritesheet;

      this.timeoutId = null;
      this.currentImage = 1;
      this.startX;
      this.currX;
      this.speed;
      this.xArray;
      this.decelSpinId;
      this.startFrame;
      this.frameFloat = 0; // the frame number expressed in a float
      this.animUpdateInterval = 30;
      this.maxSpeed = 8;
      this.decel = 0.95;
      this.restSpeed = 6;
      this.minSpeed = 4;
      this.speedToFrames = 20;
      this.spinEl = element
      this.imageWidth = 1;
      this.animateId = null;
      this.setAnimationTimeout();
      this.setUpSpinListeners();
  };
  window['Spinner'] = Spinner;

  Spinner.prototype.init = function(opts) {
    this.spinEl.css("background-image", "url(" + opts.spritesheet + ")");
    this.numImages = (opts.numImages ? opts.numImages : this.numImages);
    this.spriteWidth = (opts.spriteWidth ? opts.spriteWidth : this.spriteWidth);
    this.firstSpriteOffset = (opts.firstSpriteOffset ? opts.firstSpriteOffset : this.firstSpriteOffset);
    this.nextSpritesOffset = (opts.nextSpritesOffset ? opts.nextSpritesOffset : this.nextSpritesOffset);
  };

  Spinner.prototype.animateCar = function(){
    // console.log('animateCar')
      this.currentImage++;
      var stopAnimation = false;
      if(this.currentImage > this.numImages){
          this.currentImage = 1;
          stopAnimation = true;
      }
      this.setVisibleImage(this.currentImage);
      this.animateId = null;
      if(!stopAnimation) {
          this.animateId = window.setTimeout(this.animateCar.bind(this), 150);
      }
  }


  Spinner.prototype.setVisibleImage = function(imageNumber){

      var carBackgroundX = this.firstSpriteOffset;
      for (var i = 1; i <= this.numImages; i++) {
          if (i > 1) { carBackgroundX = this.nextSpritesOffset + (this.spriteWidth * i) - this.spriteWidth; }
          if (i === imageNumber) {
              // Originally working with images starting at 1. To avoid a full refactoring,
              // I kept the system 1-based and just subtracted the original width. This
              // gets the car to stop at the original position on startAnimation.

              this.spinEl.css("background-position-x", carBackgroundX + 'em');
          }
      }
  }


  Spinner.prototype.stopImageAnimation = function(){
    // console.log('stopImageAnimation')
      if (this.animateId) window.clearTimeout(this.animateId);
  }


  Spinner.prototype.closeButtonClicked = function() {
      closeAd();
  }

  Spinner.prototype.listenForClick = function(bool){
      this.spinEl.off('click', this.spinElClicked.bind(this));
      if(bool){
          this.spinEl.on('click', $.proxy(this.spinElClicked, this));
      }
  }

  Spinner.prototype.startSpin = function(e){
      this.clearDecelSpinTimeout();
      var eventScope = (e.originalEvent.type.indexOf('touch') != -1)? e.originalEvent.touches[0] : e.originalEvent;
      this.startX = this.currX = eventScope.screenX;
      this.startFrame = this.currentImage;
      this.xArray = [{x:this.currX, t:Date.now()}];
      this.stopCheckIfDragging();
      $(document).on('mousemove touchmove', $.proxy(this.checkIfDragging, this));
      $(document).on('mouseleave touchend touchleave', $.proxy(this.stopCheckIfDragging, this));
      this.spinEl.on('mouseleave mouseout', $.proxy(this.stopCheckIfDragging, this));
      this.listenForClick(true);
  }

  Spinner.prototype.clearDecelSpinTimeout = function(){
      if(this.decelSpinId) clearTimeout(this.decelSpinId);
  }

  /**
   *  Are we dragging or clicking?
   */
  Spinner.prototype.checkIfDragging = function(e){
    // console.log('checkifDragging')
      var eventScope = (e.originalEvent.type.indexOf('touch') != -1)? e.originalEvent.touches[0] : e.originalEvent;

      var dist = Math.abs(eventScope.screenX - this.startX);
      var threshold = 4;
      if (dist >= threshold){
          // we are dragging
          this.stopImageAnimation();
          this.stopCheckIfDragging();
          this.clearDragSpinListeners();
          $(document).on('mousemove touchmove', $.proxy(this.spinMove, this));
          $(document).on('touchend touchleave', $.proxy(this.stopSpin, this));
          this.spinEl.on('mouseout mouseleave', $.proxy(this.stopSpin, this));
          this.listenForClick(false);
      }
  }

  Spinner.prototype.stopCheckIfDragging = function(){
    // console.log('stopCheckifDragging')
      $(document).off('mousemove touchmove', this.checkIfDragging);
      $(document).off('mouseleave touchend touchleave', this.stopCheckIfDragging);
      this.spinEl.off('mouseleave mouseout', this.stopCheckIfDragging);
  }

  Spinner.prototype.spinMove = function(e){
    // console.log('spinMove')
      var eventScope = (e.originalEvent.type.indexOf('touch') != -1)? e.originalEvent.touches[0] : e.originalEvent;

      this.currX = eventScope.screenX;
      this.xArray.push({x:this.currX, t:Date.now()});
      if(this.xArray.length > 20){
          this.xArray.splice(0,1);
      }
      var percent = Math.abs(this.startX - this.currX) / this.imageWidth;
      var diff = Math.round((percent * 100) / (this.numImages * .7));
      if(this.startX < this.currX){
          diff = -diff;
      }
      var imageNumber = this.startFrame + diff;
      if(imageNumber < 1){
          imageNumber = this.numImages - (Math.abs(imageNumber) % this.numImages);
      } else {
          imageNumber = (imageNumber % this.numImages) + 1;
      }
      this.setVisibleImage(imageNumber);
      this.currentImage = imageNumber;
  }

  Spinner.prototype.clearDragSpinListeners = function() {
      $(document).off('mousemove touchmove', this.spinMove);
      $(document).off('touchend touchleave', this.stopSpin);
      this.spinEl.off('mouseout mouseleave', this.stopSpin);
  }

  Spinner.prototype.stopSpin = function(e){
      var dist = this.xArray[this.xArray.length-1].x - this.xArray[0].x;
      var t = this.xArray[this.xArray.length-1].t - this.xArray[0].t;
      if(t===0){return};
      this.speed = dist/t * this.animUpdateInterval;  // px/ms   - TODO: don't use px use percent of image
      this.speed = -Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed);
      this.clearDragSpinListeners();
      this.clearDecelSpinTimeout();
      this.decelSpinId = window.setTimeout(this.decelSpin.bind(this), this.animUpdateInterval);
      this.frameFloat = this.currentImage;
  }

  Spinner.prototype.decelSpin = function(){
      this.frameFloat += this.speed/this.speedToFrames;
      var imageNumber = Math.round(this.frameFloat);
      if(imageNumber < 1){
          imageNumber = this.numImages - (Math.abs(imageNumber) % this.numImages);
      } else {
          imageNumber = (imageNumber % this.numImages) + 1;
      }

      this.speed = this.speed * this.decel;
      var comingToRest = false;

      if(this.speed > 0){
          this.speed = Math.max(this.speed, this.minSpeed);
          if(this.speed < this.restSpeed){
              comingToRest = true;
          }
      } else {
          this.speed = Math.min(this.speed, -this.minSpeed);
          if(this.speed > -this.restSpeed){
              comingToRest = true;
          }
      }

      if(comingToRest){
          var dir = (this.speed > 0)? 1 : -1;
          var tar = 1; // Always stop on first frame
          if(tar == imageNumber){
              this.frameFloat = tar;
              this.setVisibleImage(this.frameFloat);
              this.listenForClick(true);
              this.currentImage = this.frameFloat;
              return;
          }
      }

      this.setVisibleImage(imageNumber);
      this.currentImage = imageNumber;
      this.clearDecelSpinTimeout();
      this.decelSpinId = window.setTimeout(this.decelSpin.bind(this), this.animUpdateInterval);
  }


  Spinner.prototype.spinElClicked = function(e){
      this.stopCheckIfDragging();
  }



  Spinner.prototype.setAnimationTimeout = function() {
    this.animateId = window.setTimeout(this.animateCar.bind(this), 300);
  }


  Spinner.prototype.setUpSpinListeners = function(){
    this.imageWidth = this.spinEl[0].offsetWidth;
    this.spinEl.on('touchstart mouseover', $.proxy(this.startSpin, this));
    this.listenForClick(true);
  }







  var ProgressiveText = function ProgressiveText(element) {
      this.element = element;
      this.textTimeoutId;
      this.copyIndex = 0;
      this.copyArraysIndex = 0;
      this.copyArray;
      this.blinkrate = 450;
      this.sectionPause = 1000;
      this.copyArrays = [];
      this.placementSpeed = 300;
  };

  window['ProgressiveText'] = ProgressiveText;

  ProgressiveText.prototype.init = function(opts) {
    this.blinkrate = (opts.blinkrate ? opts.blinkrate : this.blinkrate);
    this.sectionPause = (opts.sectionPause ? opts.sectionPause : this.sectionPause);
    this.placementSpeed = (opts.placementSpeed ? opts.placementSpeed : this.placementSpeed);
  };

  ProgressiveText.prototype.addText = function(text) {
    var i = 0
    while (i < text.length) {
      if (text[i + 1] === "SECTIONPAUSE") {
        this.copyArrays.push({arr: text[i], dur: this.sectionPause})
        i++;
      } else {
        this.copyArrays.push({arr: text[i], dur: this.blinkrate})
      }
      i++;

    }
    this.startNewText();
  };

  ProgressiveText.prototype.startNewText = function() {
    this.copyArray = this.copyArrays[this.copyArraysIndex].arr;
    this.textTimeoutId = window.setTimeout(this.updateText.bind(this), 0);
  };

  ProgressiveText.prototype.updateText = function() {
    this.copyIndex++;
    this.element.html(this.copyArray.slice(0,this.copyIndex).join(''));
    if(this.copyIndex < this.copyArray.length){
        this.textTimeoutId = window.setTimeout(this.updateText.bind(this), this.placementSpeed);
    } else {
        var dur = this.copyArrays[this.copyArraysIndex].dur;
        this.copyArraysIndex ++;
        if(this.copyArraysIndex < this.copyArrays.length){
            this.copyIndex = 0;
            window.setTimeout(this.startNewText.bind(this), dur);
        }
    }
  };



  var ExpandingMask = function ExpandingMask(element) {
      this.element = element;
      this.aspectPercentage = "25%";
  };

  window['ExpandingMask'] = ExpandingMask;

  ExpandingMask.prototype.init = function(opts) {
    this.aspectPercentage = (opts.aspectPercentage ? opts.aspectPercentage : this.aspectPercentage);

    this.element.css(opts.initialState, 0);
    if (opts.initialState === 'top' || opts.initialState === 'bottom') {
      this.element.css('height', this.aspectPercentage);

      this.element.on("mouseover", function(){
          this.element.css('height', "100%");
          this.element.addClass('expanded');
      }.bind(this));
      this.element.on("mouseout", function(){
          this.element.css('height', this.aspectPercentage);
          this.element.removeClass('expanded');
      }.bind(this));
    } else {
      this.element.css('width', this.aspectPercentage);

      this.element.on("mouseover", function(){
          this.element.css('width', "100%");
          this.element.addClass('expanded');
      }.bind(this));
      this.element.on("mouseout", function(){
          this.element.css('width', this.aspectPercentage);
          this.element.removeClass('expanded');
      }.bind(this));
    }
  }



  var SwipeAway = function SwipeAway(element) {
      this.swipeEl = element;
      this.swipeOffOptions = ["left", "right", "up", "down"];

      this.START_DRAG_RATIO = .05;
      this.TRIGGER_SWIPE_RATIO = .20;
      this.transitionDuration = '2s';
      this.startX = 0;
      this.startDragAmtX = 0;
      this.triggerSwipeAmtX = 0;
      this.swipeDragging = false;
      this.curX = 0;
      this.curY = 0;
      this.startY = 0;
      this.startDragAmtY = 0;
      this.triggerSwipeAmtY = 0;
      this.swipeContainer = document.querySelector('body');
      this.DIRECTIONS = {
          left:  "left",
          right: "right",
          up: "up",
          down: "down"

      };

      this.swipingDir = null;
  };

  window['SwipeAway'] = SwipeAway;

  SwipeAway.prototype.init = function(opts) {
    this.swipeOffOptions = (opts.swipeOffOptions ? opts.swipeOffOptions : this.swipeOffOptions);
    this.TRIGGER_SWIPE_RATIO = (opts.triggerRatio ? opts.triggerRatio : this.TRIGGER_SWIPE_RATIO);
    this.transitionDuration = (opts.transitionDuration ? opts.transitionDuration : this.transitionDuration);

    this.swipeContainer.style.overflow = "hidden";
    this.activate();
  }

  SwipeAway.prototype.activate = function() {
    this.swipeEl.bind('touchstart mousedown', $.proxy(this.onTouchStart, this));
  }


  SwipeAway.prototype.onTouchStart = function(e){
      e.preventDefault();
      if (e.type === "touchstart") {
        this.curY = this.startY = e.touches[0].clientY;
        this.curX = this.startX = e.touches[0].clientX;

      } else if (e.type === "mousedown") {
        this.curY = this.startY = e.clientY;
        this.curX = this.startX = e.clientX;
      }
      this.swipeEl.on('touchmove mousemove', $.proxy(this.onTouchMove, this));
      this.swipeEl.on('touchend mouseup mouseleave', $.proxy(this.onTouchEnd, this));

      var h = this.swipeContainer.clientHeight;
      this.startDragAmtY = h * this.START_DRAG_RATIO;
      this.triggerSwipeAmtY = h * this.TRIGGER_SWIPE_RATIO;

      var w = this.swipeContainer.clientWidth;
      this.startDragAmtX = w * this.START_DRAG_RATIO;
      this.triggerSwipeAmtX = w * this.TRIGGER_SWIPE_RATIO;
  }

  SwipeAway.prototype.onTouchMove = function(e){
    if (e.type === "touchmove") {
      this.curX = e.touches[0].clientX;
      this.curY = e.touches[0].clientY;

    } else if (e.type === "mousemove") {
      this.curX = e.clientX;
      this.curY = e.clientY;
    }
      var amtX = this.curX - this.startX;
      var amtY = this.curY - this.startY;

      if(!this.swipeDragging) {

          if (this.swipeOffOptions.indexOf(this.DIRECTIONS.left) != -1) {
              if(amtX < -this.startDragAmtX){
                  this.swipeDragging = true;
                  this.swipingDir = this.DIRECTIONS.left;
              }
          }
          if (this.swipeOffOptions.indexOf(this.DIRECTIONS.right) != -1) {
              if(amtX > this.startDragAmtX){
                  this.swipeDragging = true;
                  this.swipingDir = this.DIRECTIONS.right;
              }
          }
          if (this.swipeOffOptions.indexOf(this.DIRECTIONS.up) != -1) {
              if(amtY < -this.startDragAmtY){
                  this.swipeDragging = true;
                  this.swipingDir = this.DIRECTIONS.up;
              }
          }
          if (this.swipeOffOptions.indexOf(this.DIRECTIONS.down) != -1) {
              if(amtY > this.startDragAmtY){
                  this.swipeDragging = true;
                  this.swipingDir = this.DIRECTIONS.down;
              }
          }

      }


      if(this.swipeDragging){

          if(this.swipingDir === this.DIRECTIONS.left && amtX > 0) {
              this.onTouchEnd(e);
              return;
          }
          if(this.swipingDir === this.DIRECTIONS.right && amtX < 0) {
              this.onTouchEnd(e);
              return;
          }
          if(this.swipingDir === this.DIRECTIONS.up && amtY > 0) {
              this.onTouchEnd(e);
              return;
          }
          if(this.swipingDir === this.DIRECTIONS.down && amtY < 0) {
              this.onTouchEnd(e);
              return;
          }

          var xPos = this.curX-this.startX;
          var yPos = this.curY-this.startY;

          if (this.swipingDir === this.DIRECTIONS.right || this.swipingDir === this.DIRECTIONS.left) {
              this.swipeEl.css({
                  webkitTransform: "translate3d("+xPos+"px,0,0)",
                  transform: "translate3d("+xPos+"px,0,0)"
              });
          } else if (this.swipingDir === this.DIRECTIONS.up || this.swipingDir === this.DIRECTIONS.down) {
              this.swipeEl.css({
                  webkitTransform: "translate3d(0,"+yPos+"px,0)",
                  transform: "translate3d(0,"+yPos+"px,0)"
              });
          }

      }
  }

  SwipeAway.prototype.onTouchEnd = function(e) {

      this.swipeEl.off('touchmove mousemove', this.onTouchMove);
      this.swipeEl.off('touchend mouseup', this.onTouchEnd);

      if (this.swipeDragging) {

          if ((this.swipingDir === this.DIRECTIONS.left || this.swipingDir === this.DIRECTIONS.right) && Math.abs(this.curX - this.startX) > this.triggerSwipeAmtX) {
              var tarX;
              if(this.curX > this.startX){
                  tarX = this.swipeContainer.clientWidth + this.swipeEl[0].clientWidth * 5;
              } else {
                  tarX = - this.swipeEl[0].clientWidth * 5;
              }
              this.swipeEl.css({
                  webkitTransform: "translate3d("+tarX+"px,0,0)",
                  transform: "translate3d("+tarX+"px,0,0)",
                  transitionDuration: this.transitionDuration
              });
              return;
          } else if ((this.swipingDir === this.DIRECTIONS.up || this.swipingDir === this.DIRECTIONS.down) && Math.abs(this.curY - this.startY) > this.triggerSwipeAmtY) {
              var tarY;
              if (this.curY > this.startY) {
                  var tarY = this.swipeEl[0].clientWidth * 5;
              } else {
                  var tarY = - this.swipeEl[0].clientWidth * 5;
              }
              this.swipeEl.css({
                  webkitTransform: "translate3d(0,"+tarY+"px,0)",
                  transform: "translate3d(0,"+tarY+"px,0)",
                  transitionDuration: this.transitionDuration
              });
              return;

          } else {
              this.swipeEl.css({
                  webkitTransform: "translate3d(0px,0,0)",
                  transform: "translate3d(0px,0,0)"
              });
              this.swipingDir = null;
          }
          this.swipeDragging = false;
      }

  }


  var ImageChange = function ImageChange(element) {
      this.element = element;
      this.mainImage;
      this.imageSize = '5em';
      this.otherImages = [];
  };

  window['ImageChange'] = ImageChange;

  ImageChange.prototype.init = function(opts) {
    this.mainImage = (opts.mainImage ? opts.mainImage : this.mainImage);
    this.imageSize = (opts.imageSize ? opts.imageSize : this.imageSize);
    this.otherImages = (opts.otherImages ? opts.otherImages : this.otherImages);

    this.activate();
  }

  ImageChange.prototype.activate = function() {
    this.element.attr('src', this.mainImage)
    this.element.css('height', this.imageSize);

    this.addImageOptions();
  }

  ImageChange.prototype.addImageOptions = function() {
    var i = 0
    var container = $('#selector-container')
    this.otherImages.forEach(function(img){
      container.append("<div id=" + 'i' + i + " class='mini-img'></div>");
      var miniImg = $('#i' + i)
      miniImg.click(this.changeColor.bind(this, img))
      miniImg.css('background', img.color)
      i++;
    }.bind(this))
  }

  ImageChange.prototype.changeColor = function(img) {
    this.element.attr('src', img.location);
  }




  var FlipCard = function FlipCard() {
      this.mainText = "";
      this.mainFontSize = "1em";
      this.mainHeight = "5em";
      this.bottomHeight = "2em";
      this.textSpan = $('#text');
      this.cardDiv = $('#card');
      this.bottomDiv = $('#bottom');
      this.aTag = $('#image')
  };

  window['FlipCard'] = FlipCard;

  FlipCard.prototype.init = function(opts) {
    this.bottomHeight = (opts.bottomHeight ? opts.bottomHeight : this.bottomHeight);
    this.mainHeight = (opts.mainHeight ? opts.mainHeight : this.mainHeight);
    this.mainText = (opts.mainText ? opts.mainText : this.mainText);
    this.mainFontSize = (opts.mainFontSize ? opts.mainFontSize : this.mainFontSize);
    this.backgroundImg = (opts.backgroundImg ? opts.backgroundImg : this.backgroundImg);

    this.activate();
  }

  FlipCard.prototype.activate = function() {
    this.aTag.css('background', 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), url('+ this.backgroundImg + ')')
    this.aTag.css('background-size', '0, cover')
    this.textSpan.html(this.mainText);
    this.textSpan.css('font-size', this.mainFontSize);
    this.cardDiv.css('height', this.mainHeight);
    this.bottomDiv.css('height', this.bottomHeight);
    this.bottomDiv.css('transform', 'rotateX(270deg) translateY(' + this.bottomHeight + ')');
  }



  var CloseButton = function CloseButton(element) {
      this.element = element;
      this.closeDirection = "left";

      this.DIRECTIONS = {
          left:  "left",
          right: "right",
          up: "up",
          down: "down"

      };
  };

  window['CloseButton'] = CloseButton;

  CloseButton.prototype.init = function(opts) {
    this.closeDirection = (opts.closeDirection ? opts.closeDirection : this.closeDirection);
    this.closeSpeed = (opts.closeSpeed ? opts.closeSpeed : this.closeSpeed);

    this.element.on('click', $.proxy(this.closeButtonClicked, this));
  }

  CloseButton.prototype.closeButtonClicked = function() {
    var windowWidth = window.innerWidth * 2;
    var windowHeight = window.innerHeight * 2;

    if (this.closeDirection === this.DIRECTIONS.left) {
        TweenMax.to("#closeable-wrapper", this.closeSpeed, {
            left: '-' + windowWidth + "px"
        });
    } else if (this.closeDirection === this.DIRECTIONS.right){
        TweenMax.to("#closeable-wrapper", this.closeSpeed, {
            left: windowWidth + "px"
        });
    } else if (this.closeDirection === this.DIRECTIONS.up){
        TweenMax.to("#closeable-wrapper", this.closeSpeed, {
            top: '-' + windowHeight + "px"
        });
    } else if (this.closeDirection === this.DIRECTIONS.down){
        TweenMax.to("#closeable-wrapper", this.closeSpeed, {
            top: windowHeight + "px"
        });
    }
  }

  var SlideInOut = function SlideInOut(element) {
      this.element = element;
      this.slideInFrom = "left";
      this.timeToClose = 10;
      this.sliderSpeed = .5;

      this.DIRECTIONS = {
          left:  "left",
          right: "right",
          top: "top",
          bottom: "bottom"

      };
  };

  window['SlideInOut'] = SlideInOut;

  SlideInOut.prototype.init = function(opts) {
    this.slideInFrom = (opts.slideInFrom ? opts.slideInFrom : this.slideInFrom);
    this.timeToClose = (opts.timeToClose ? opts.timeToClose : this.timeToClose);
    this.sliderSpeed = (opts.sliderSpeed ? opts.sliderSpeed : this.sliderSpeed);

    var className = this.element[0].className;
    var sliderTween = new TimelineLite();

    switch (this.slideInFrom) {
      case this.DIRECTIONS.left :
        this.element.css("left", -window.innerWidth);
        sliderTween.to("." + className, this.sliderSpeed, {left: 0, ease: Power2.linear});
        sliderTween.to("." + className, this.sliderSpeed, {left: -window.innerWidth, delay: this.timeToClose, ease: Power2.linear});
        break;
      case this.DIRECTIONS.right :
        this.element.css("right", -window.innerWidth);
        sliderTween.to("." + className, this.sliderSpeed, {right: 0, ease: Power2.linear});
        sliderTween.to("." + className, this.sliderSpeed, {right: -window.innerWidth, delay: this.timeToClose, ease: Power2.linear});
        break;
      case this.DIRECTIONS.top :
        this.element.css("top", -window.innerHeight);
        sliderTween.to("." + className, this.sliderSpeed, {top: 0, ease: Power2.linear});
        sliderTween.to("." + className, this.sliderSpeed, {top: -window.innerHeight, delay: this.timeToClose, ease: Power2.linear});
        break;
      case this.DIRECTIONS.bottom :
        this.element.css("bottom", -window.innerHeight);
        sliderTween.to("." + className, this.sliderSpeed, {bottom: 0, ease: Power2.linear});
        sliderTween.to("." + className, this.sliderSpeed, {bottom: -window.innerHeight, delay: this.timeToClose, ease: Power2.linear});
        break;
    }
  }

})();
