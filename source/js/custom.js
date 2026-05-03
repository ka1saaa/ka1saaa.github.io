(function () {
  // 手机端不加载特效（你也可以改成 768）
  if (window.innerWidth < 992) return;

  // 1) 樱花
  var sakura = document.createElement('script');
  sakura.src = "https://cdn.jsdelivr.net/gh/TRHX/CDN-for-sakurajs@3.1.0/sakura.js";
  sakura.async = true;
  document.body.appendChild(sakura);

  // 2) 粒子背景（canvas-nest）
  var nest = document.createElement('script');
  nest.src = "https://cdn.jsdelivr.net/npm/canvas-nest.js@2.0.4/dist/canvas-nest.js";
  nest.async = true;
  nest.setAttribute('color', '255,120,180');
  nest.setAttribute('opacity', '0.5');
  nest.setAttribute('count', '90');
  document.body.appendChild(nest);

  // 3) 看板娘 Live2D
  var live2d = document.createElement('script');
  live2d.src = "https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js";
  live2d.async = true;
  document.body.appendChild(live2d);
})();


// ===== 副标题：打字机效果（逐字出现）=====
(function () {
  const subtitles = [
    "我看到了「生生不息」的激荡！",
    "I have witnessed the surging power of 「endless regeneration」!"
  ];

  const typeSpeed = 90;      // 每个字符间隔(ms) 越小越快
  const holdTime = 1400;     // 一句话打完后停留时间
  const deleteSpeed = 35;    // 删除速度(ms)，不想删除就把 deleteMode 设为 false
  const deleteMode = true;   // true：打完再删掉换下一句；false：直接切换下一句

  function ensureEl() {
    let el = document.querySelector("#site-subtitle");
    if (el) return el;

    const title = document.querySelector("#site-title");
    if (!title) return null;

    el = document.createElement("div");
    el.id = "site-subtitle";
    title.insertAdjacentElement("afterend", el);
    return el;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function typeSentence(el, text) {
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(typeSpeed);
    }
  }

  async function deleteSentence(el) {
    while (el.textContent.length > 0) {
      el.textContent = el.textContent.slice(0, -1);
      await sleep(deleteSpeed);
    }
  }

  async function run() {
    const el = ensureEl();
    if (!el) return;

    el.classList.add("subtitle-typing");

    let i = 0;
    while (true) {
      const text = subtitles[i % subtitles.length];
      await typeSentence(el, text);
      await sleep(holdTime);

      if (deleteMode) {
        await deleteSentence(el);
        await sleep(250);
      }

      i++;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
