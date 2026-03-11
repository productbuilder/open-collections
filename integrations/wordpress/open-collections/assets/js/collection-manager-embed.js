(function () {
  var bundlePromise;

  function safeParseConfig() {
    if (typeof window.OpenCollectionsConfig === 'undefined') {
      return {};
    }

    return window.OpenCollectionsConfig;
  }

  function loadManagerBundle(config) {
    var bundleUrl = config && config.manager ? config.manager.bundleUrl : '';

    if (!bundleUrl) {
      return Promise.resolve(false);
    }

    if (bundlePromise) {
      return bundlePromise;
    }

    bundlePromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = bundleUrl;
      script.async = true;
      script.onload = function () {
        resolve(true);
      };
      script.onerror = function () {
        reject(new Error('Failed to load Collection Manager bundle: ' + bundleUrl));
      };
      document.head.appendChild(script);
    });

    return bundlePromise;
  }

  function mountNode(node, config) {
    if (window.CollectionManager && typeof window.CollectionManager.mount === 'function') {
      window.CollectionManager.mount(node, config);
      return;
    }

    var pre = document.createElement('pre');
    pre.className = 'open-collections-config-preview';
    pre.textContent =
      'Collection Manager bundle is not active yet.\n' +
      'Set a valid Manager bundle URL or expose window.CollectionManager.mount(root, config).\n\n' +
      JSON.stringify(config, null, 2);
    node.appendChild(pre);
  }

  function mountManager(config) {
    var selector = config.mountSelector || '.open-collections-shortcode-root';
    var nodes = document.querySelectorAll(selector);

    if (!nodes.length) {
      return;
    }

    loadManagerBundle(config)
      .catch(function (error) {
        console.warn(error.message);
      })
      .finally(function () {
        nodes.forEach(function (node) {
          if (node.dataset.ocpMounted === '1') {
            return;
          }

          node.dataset.ocpMounted = '1';
          mountNode(node, config);
        });
      });

    // Future direction:
    // - Keep protocol-facing route behavior in WordPress.
    // - Keep publishing/editor logic in Collection Manager and provider modules.
  }

  function mountStub(config) {
    if (!config || typeof config !== 'object') {
      return;
    }

    mountManager(config);

    if (config.mountSelector !== '.open-collections-shortcode-root') {
      mountManager(
        Object.assign({}, config, {
          mountSelector: '.open-collections-shortcode-root',
        })
      );
    }

    if (config.mountSelector !== '#open-collections-manager-root') {
      mountManager(
        Object.assign({}, config, {
          mountSelector: '#open-collections-manager-root',
        })
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mountStub(safeParseConfig());
    });
  } else {
    mountStub(safeParseConfig());
  }
})();
