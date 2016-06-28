// NOTES:
// You'll need to include an e.stopPropagation in the onTouchDrag of the text-box-directive (if text)
// Add ww-swipe=(string of swipe directions) to item in item-template
// Add ng-show="!vm.showHistoryItem" (or ng-show="!vm.activeEventIsEngaged") to "ww-bug" in wrapper-template
// Add scope.$on("swiped-off", function(e) { scope.vm.itemClicked() }) to link function in item-directive


(function() {
    'use strict';

    angular
        .module('watchwith.swipe')
        .directive('wwSwipe', wwSwipe);

    wwSwipe.$inject = ['$timeout'];

    /* @ngInject */
    function wwSwipe ($timeout) {

        var directive = {
            restrict: 'A',
            replace: false,
            bindToController: true,
            controller: SwipeController,
            controllerAs: 'vm',
            scope: {
            },
            link: link
        };

        function link (scope, element, attr) {
            var vm = this;

            scope.vm.DIRECTIONS = {
                left:  "left",
                right: "right",
                up: "up",
                down: "down"

            };

            var inputDirs = attr.wwSwipe.split(" ");
            scope.vm.validDirs = [];

            inputDirs.forEach(function(d){
                if(scope.vm.DIRECTIONS[d]){
                    scope.vm.validDirs.push(scope.vm.DIRECTIONS[d]);
                }
            });

            scope.vm.swipeEl = element;


            if(attr.swipeContainer != undefined){
                scope.swipeContainer = angular.element(document.querySelector(attr.swipeContainer));
            }

            if(!scope.vm.swipeContainer || scope.vm.swipeContainer.addClass === undefined) {
                scope.vm.swipeContainer = angular.element(document.querySelector('.ww-stage'));
            }

            scope.vm.emitSwipedOff = function(){ scope.$emit("swiped-off") }

            $timeout(scope.vm.activate, 0);


        }

        return directive;
    }

    SwipeController.$inject = ['$window'];
    /* @ngInject */
    function SwipeController ($window) {

        var vm = this;
        vm.activate = activate;

        vm.onTouchStart = onTouchStart;
        vm.START_DRAG_RATIO = .05;
        vm.TRIGGER_SWIPE_RATIO = .20;
        vm.startX = 0;
        vm.startDragAmtX = 0;
        vm.triggerSwipeAmtX = 0;
        vm.swipeTween = null;
        vm.swipeDragging = false;
        vm.curX = 0;
        vm.onTouchMove = onTouchMove;
        vm.onTouchEnd = onTouchEnd;

        vm.curY = 0;
        vm.startY = 0;
        vm.startDragAmtY = 0;
        vm.triggerSwipeAmtY = 0;

        vm.swipingDir = null;


        function activate() {
            vm.swipeEl.on('touchstart', vm.onTouchStart);
        }


        function onTouchStart(e){

            vm.curY = vm.startY = e.touches[0].clientY;
            var h = vm.swipeContainer[0].clientHeight;
            vm.startDragAmtY = h * vm.START_DRAG_RATIO;
            vm.triggerSwipeAmtY = h * vm.TRIGGER_SWIPE_RATIO;

            vm.curX = vm.startX = e.touches[0].clientX;
            var w = vm.swipeContainer[0].clientWidth;
            vm.startDragAmtX = w * vm.START_DRAG_RATIO;
            vm.triggerSwipeAmtX = w * vm.TRIGGER_SWIPE_RATIO;

            vm.swipeEl.on('touchmove', vm.onTouchMove);
            vm.swipeEl.on('touchend', vm.onTouchEnd);
        }

        function onTouchMove(e){

            vm.curX = e.touches[0].clientX;
            var amtX = vm.curX - vm.startX;

            vm.curY = e.touches[0].clientY;
            var amtY = vm.curY - vm.startY;

            if(!vm.swipeDragging) {

                if (vm.validDirs.indexOf(vm.DIRECTIONS.left) != -1) {
                    if(amtX < -vm.startDragAmtX){
                        vm.swipeDragging = true;
                        vm.swipingDir = vm.DIRECTIONS.left;
                    }
                }
                if (vm.validDirs.indexOf(vm.DIRECTIONS.right) != -1) {
                    if(amtX > vm.startDragAmtX){
                        vm.swipeDragging = true;
                        vm.swipingDir = vm.DIRECTIONS.right;
                    }
                }
                if (vm.validDirs.indexOf(vm.DIRECTIONS.up) != -1) {
                    if(amtY < -vm.startDragAmtY){
                        vm.swipeDragging = true;
                        vm.swipingDir = vm.DIRECTIONS.up;
                    }
                }
                if (vm.validDirs.indexOf(vm.DIRECTIONS.down) != -1) {
                    if(amtY > vm.startDragAmtY){
                        vm.swipeDragging = true;
                        vm.swipingDir = vm.DIRECTIONS.down;
                    }
                }

            }


            if(vm.swipeDragging){

                if(vm.swipingDir === vm.DIRECTIONS.left && amtX > 0) {
                    vm.onTouchEnd(e);
                    return;
                }
                if(vm.swipingDir === vm.DIRECTIONS.right && amtX < 0) {
                    vm.onTouchEnd(e);
                    return;
                }
                if(vm.swipingDir === vm.DIRECTIONS.up && amtY > 0) {
                    vm.onTouchEnd(e);
                    return;
                }
                if(vm.swipingDir === vm.DIRECTIONS.down && amtY < 0) {
                    vm.onTouchEnd(e);
                    return;
                }

                var xPos = vm.curX-vm.startX;
                var yPos = vm.curY-vm.startY;

                if (vm.swipingDir === vm.DIRECTIONS.right || vm.swipingDir === vm.DIRECTIONS.left) {
                    vm.swipeEl.css({
                        webkitTransform: "translate3d("+xPos+"px,0,0)",
                        transform: "translate3d("+xPos+"px,0,0)"
                    });
                } else if (vm.swipingDir === vm.DIRECTIONS.up || vm.swipingDir === vm.DIRECTIONS.down) {
                    vm.swipeEl.css({
                        webkitTransform: "translate3d(0,"+yPos+"px,0)",
                        transform: "translate3d(0,"+yPos+"px,0)"
                    });
                }

            }
        }

        function onTouchEnd(e) {

            vm.swipeEl.off('touchmove', vm.onTouchMove);
            vm.swipeEl.off('touchend', vm.onTouchEnd);

            if (vm.swipeDragging) {

                if ((vm.swipingDir === vm.DIRECTIONS.left || vm.swipingDir === vm.DIRECTIONS.right) && Math.abs(vm.curX - vm.startX) > vm.triggerSwipeAmtX) {

                    var tarX;
                    if(vm.curX > vm.startX){
                        tarX = vm.swipeContainer[0].clientWidth + vm.swipeEl[0].clientWidth * 20;
                    } else {
                        tarX = - vm.swipeEl[0].clientWidth * 20;
                    }
                    vm.swipeEl.addClass("ww-swiped-off");
                    // vm.swipeEl.css({
                    //     webkitTransform: "translate3d("+tarX+"px,0,0)",
                    //     transform: "translate3d("+tarX+"px,0,0)"
                    // });

                    vm.emitSwipedOff();

                    return;
                } else if ((vm.swipingDir === vm.DIRECTIONS.up || vm.swipingDir === vm.DIRECTIONS.down) && Math.abs(vm.curY - vm.startY) > vm.triggerSwipeAmtY) {

                    var tarY;
                    if (vm.curY > vm.startY) {
                        var tarY = vm.swipeEl[0].clientWidth * 20;
                    } else {
                        var tarY = - vm.swipeEl[0].clientWidth * 20;
                    }
                    vm.swipeEl.addClass("ww-swiped-off");
                    // vm.swipeEl.css({
                    //     webkitTransform: "translate3d(0,"+tarY+"px,0)",
                    //     transform: "translate3d(0,"+tarY+"px,0)"
                    // });

                    vm.emitSwipedOff();
                    return;

                } else {
                    vm.swipeEl.css({
                        webkitTransform: "translate3d(0px,0,0)",
                        transform: "translate3d(0px,0,0)"
                    });
                    vm.swipingDir = null;
                }
                vm.swipeDragging = false;
            }

        }

    }

})();
