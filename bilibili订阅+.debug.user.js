// ==UserScript==
// @name         (debug) bilibili订阅+
// @namespace    https://github.com/YanxinTang/Tampermonkey
// @require     https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js
// @include     *.bilibili.com/*
// @exclude     *://live.bilibili.com/*
// @exclude     *://manga.bilibili.com/*
// @exclude     *://bw.bilibili.com/*
// @exclude     *://show.bilibili.com/*
// @noframes
// ==/UserScript==
(async () => {
  try {
    const timestamp = Date.now();
    eval(await fetch(`http://127.0.0.1:8080/bilibili订阅+.user.js?t=${timestamp}`).then(response => response.text()));
  } catch (error) {
    console.error(error);
  }
})();