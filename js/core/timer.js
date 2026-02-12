/**
 * ChaoOPIc - Timer Module
 * 카운트다운/카운트업 타이머 유틸
 */
ChaoOPIc.core.timer = (function() {
  return {
    /**
     * 타이머 인스턴스 생성
     * @param {Object} options
     * @param {number} options.duration - 총 시간 (초)
     * @param {boolean} [options.countDown=true] - true: 카운트다운
     * @param {function} [options.onTick] - 매초 콜백 (remainingSec)
     * @param {function} [options.onComplete] - 완료 콜백
     */
    create: function(options) {
      var duration = options.duration;
      var remaining = duration;
      var elapsed = 0;
      var intervalId = null;
      var countDown = options.countDown !== false;

      function tick() {
        if (countDown) {
          remaining--;
          if (options.onTick) options.onTick(remaining);
          if (remaining <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            if (options.onComplete) options.onComplete();
          }
        } else {
          elapsed++;
          if (options.onTick) options.onTick(elapsed);
          if (elapsed >= duration) {
            clearInterval(intervalId);
            intervalId = null;
            if (options.onComplete) options.onComplete();
          }
        }
      }

      return {
        start: function() {
          if (intervalId) return;
          intervalId = setInterval(tick, 1000);
        },
        pause: function() {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        },
        resume: function() {
          this.start();
        },
        reset: function() {
          this.pause();
          remaining = duration;
          elapsed = 0;
        },
        getRemaining: function() {
          return countDown ? remaining : (duration - elapsed);
        },
        isRunning: function() {
          return intervalId !== null;
        }
      };
    },

    formatTime: function(seconds) {
      if (seconds < 0) seconds = 0;
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = seconds % 60;
      var mm = (m < 10 ? '0' : '') + m;
      var ss = (s < 10 ? '0' : '') + s;
      return h > 0 ? (h + ':' + mm + ':' + ss) : (mm + ':' + ss);
    }
  };
})();
