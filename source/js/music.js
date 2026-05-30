(function () {
  if (window.innerWidth < 768) return;

  if (window.__APAYER_LOADED__) return;
  window.__APAYER_LOADED__ = true;

  function loadCss(href) {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function loadJs(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  loadCss("https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css");

  // 外层（固定顶部）
  var bar = document.createElement("div");
  bar.id = "aplayer-topbar";
  document.body.appendChild(bar);

  bar.style.position = "fixed";
  bar.style.left = "0";
  bar.style.top = "0";
  bar.style.right = "0";
  bar.style.zIndex = "10000";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "10px";
  bar.style.padding = "8px 12px";
  bar.style.background = "rgba(255,255,255,0.72)";
  bar.style.backdropFilter = "blur(10px)";
  bar.style.webkitBackdropFilter = "blur(10px)";
  bar.style.borderBottom = "1px solid rgba(0,0,0,0.06)";

  // 按钮
  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "aplayer-toggle";
  btn.textContent = "🎵 展开";
  btn.style.cursor = "pointer";
  btn.style.border = "1px solid rgba(0,0,0,0.12)";
  btn.style.background = "rgba(255,255,255,0.65)";
  btn.style.borderRadius = "10px";
  btn.style.padding = "6px 10px";
  btn.style.fontSize = "14px";
  bar.appendChild(btn);

  // 播放器容器
  var wrap = document.createElement("div");
  wrap.id = "aplayer-top";
  bar.appendChild(wrap);

  // 默认“隐藏”（折叠）
  var expanded = false;
  function applyState() {
    if (expanded) {
      wrap.style.display = "block";
      wrap.style.flex = "1";
      btn.textContent = "🎵 收起";
      document.body.style.paddingTop = "72px";
      document.documentElement.style.scrollPaddingTop = "80px";
    } else {
      wrap.style.display = "none";
      btn.textContent = "🎵 展开";
      document.body.style.paddingTop = "42px";
      document.documentElement.style.scrollPaddingTop = "50px";
    }
  }
  applyState();

  btn.addEventListener("click", function () {
    expanded = !expanded;
    applyState();
  });

  // 加载 APlayer 并初始化
  loadJs("https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js")
    .then(function () {
      // eslint-disable-next-line no-undef
      var ap = new APlayer({
        container: wrap,
        fixed: false,
        autoplay: false, // 保持 false，避免浏览器拦截
        loop: "all",
        order: "random",
        preload: "metadata",
        volume: 0.7,
        mutex: true,
        listFolded: true,
        listMaxHeight: 220,
        audio: [
          {
            name: "Song 1",
            artist: "ka1saaa",
            url: "/music/song1.mp3",
            cover: "/img/img3.jpg"
          }
          // 你要加第二首就照这个格式继续加逗号和对象
        ]
      });

      // 第一次点击页面就播放（最稳：不会被浏览器 autoplay 策略拦）
      function playOnce() {
        try {
          ap.play();
        } catch (e) {}
        document.removeEventListener("click", playOnce);
      }
      document.addEventListener("click", playOnce, { once: true });
    })
    .catch(function () {
      console.warn("[music] APlayer load failed");
    });
})();
