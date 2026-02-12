/**
 * ChaoOPIc - UI Module
 * 공통 UI 헬퍼 (DOM 조작, 컴포넌트 생성)
 */
ChaoOPIc.core.ui = (function() {
  var toastTimeout = null;

  return {
    // DOM 셀렉터 단축
    $: function(selector) {
      return document.querySelector(selector);
    },
    $$: function(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector));
    },

    // 엘리먼트 생성 헬퍼
    createElement: function(tag, attrs, children) {
      var el = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach(function(key) {
          if (key === 'className') {
            el.className = attrs[key];
          } else if (key === 'textContent') {
            el.textContent = attrs[key];
          } else if (key === 'innerHTML') {
            el.innerHTML = attrs[key];
          } else if (key.indexOf('on') === 0) {
            el.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
          } else {
            el.setAttribute(key, attrs[key]);
          }
        });
      }
      if (children) {
        if (typeof children === 'string') {
          el.textContent = children;
        } else if (Array.isArray(children)) {
          children.forEach(function(child) {
            if (child) el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
          });
        } else {
          el.appendChild(children);
        }
      }
      return el;
    },

    // 네비게이션 렌더링
    renderNav: function(currentPage) {
      var nav = this.$('.nav-links');
      if (!nav) return;
      var pages = [
        { id: 'index', label: '홈', href: 'index.html' },
        { id: 'simulation', label: '시뮬레이션', href: 'simulation.html' },
        { id: 'topics', label: '주제별 학습', href: 'topics.html' },
        { id: 'vocabulary', label: '어휘 학습', href: 'vocabulary.html' }
      ];
      nav.innerHTML = '';
      var self = this;
      pages.forEach(function(p) {
        var a = self.createElement('a', {
          href: p.href,
          className: 'nav-item' + (p.id === currentPage ? ' nav-active' : '')
        }, p.label);
        nav.appendChild(a);
      });
    },

    // 토스트 알림
    showToast: function(message, type) {
      type = type || 'info';
      var existing = this.$('.toast');
      if (existing) existing.remove();
      if (toastTimeout) clearTimeout(toastTimeout);

      var toast = this.createElement('div', {
        className: 'toast toast-' + type
      }, message);
      document.body.appendChild(toast);

      // 애니메이션을 위해 약간의 딜레이
      requestAnimationFrame(function() {
        toast.classList.add('toast-show');
      });

      toastTimeout = setTimeout(function() {
        toast.classList.remove('toast-show');
        setTimeout(function() { toast.remove(); }, 300);
      }, 3000);
    },

    // 모달
    showModal: function(options) {
      this.hideModal();
      var self = this;

      var overlay = this.createElement('div', { className: 'modal-overlay' });
      var modal = this.createElement('div', { className: 'modal' });

      if (options.title) {
        modal.appendChild(this.createElement('h3', { className: 'modal-title' }, options.title));
      }

      var body = this.createElement('div', { className: 'modal-body' });
      if (typeof options.content === 'string') {
        body.innerHTML = options.content;
      } else if (options.content) {
        body.appendChild(options.content);
      }
      modal.appendChild(body);

      if (options.buttons) {
        var footer = this.createElement('div', { className: 'modal-footer' });
        options.buttons.forEach(function(btn) {
          footer.appendChild(self.createElement('button', {
            className: 'btn ' + (btn.className || 'btn-secondary'),
            onClick: function() {
              if (btn.onClick) btn.onClick();
              if (btn.close !== false) self.hideModal();
            }
          }, btn.label));
        });
        modal.appendChild(footer);
      }

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) self.hideModal();
      });

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    },

    hideModal: function() {
      var overlay = this.$('.modal-overlay');
      if (overlay) overlay.remove();
    },

    // 프로그레스 바
    renderProgress: function(container, current, total) {
      var pct = total > 0 ? Math.round((current / total) * 100) : 0;
      container.innerHTML = '';
      var bar = this.createElement('div', { className: 'progress-bar' });
      var fill = this.createElement('div', {
        className: 'progress-fill',
        style: 'width:' + pct + '%'
      });
      bar.appendChild(fill);
      var label = this.createElement('span', { className: 'progress-label' }, current + ' / ' + total);
      container.appendChild(bar);
      container.appendChild(label);
    }
  };
})();
