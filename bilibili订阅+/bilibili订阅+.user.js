// ==UserScript==
// @name         bilibili订阅+
// @namespace    https://github.com/YanxinTang/Tampermonkey
// @version      0.5.2
// @description  bilibili导航添加订阅按钮以及订阅列表
// @author       tyx1703
// @include      *.bilibili.com/*
// @license      MIT
// @noframes
// @require     https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js
// @exclude     *://live.bilibili.com/*
// @exclude     *://manga.bilibili.com/*
// @exclude     *://bw.bilibili.com/*
// @exclude     *://show.bilibili.com/*
// ==/UserScript==

(function() {
  'use strict';

  const DedeUserID = getCookie('DedeUserID');
  const loginStatus = DedeUserID !== '';
  if (!loginStatus) {
    log("少侠请先登录~  哔哩哔哩 (゜-゜)つロ 干杯~")
    return;
  }

  const PATH = location.pathname;
  const useOldVersion = isVideoPlayerPage(PATH) && !isNewVideoPlayerPage(PATH);
  if (useOldVersion) {
    getOldNavList(main);
  } else {
    getNavList(main);
  }
  style();

  /**
   * main
   * @param {*} navList 
   */
  function main(navList) {
    const subscribeMenuEl = document.createElement('li');
    subscribeMenuEl.setAttribute('id', 'subscribe');
    navList.appendChild(subscribeMenuEl);
    const subscribe = new Vue({
      el: subscribeMenuEl,
      data: {
        show: false,
        seasons: [],
        loadflag: true,
        pages: -1,             // count of pages
        page: 1,              // current page
        mid: '',
      },
      created() {
        this.mid = DedeUserID;
        this.getSubscribe();
      },
      updated(){
        this.loadflag = true; // allow loading after update data
      },
      computed: {
        url(){
          return `//space.bilibili.com/ajax/Bangumi/getList?mid=${this.mid}&page=${this.page}`;
        },
        href(){
          return `//space.bilibili.com/${this.mid}/bangumi`;
        }
      },
      methods: {
        getSubscribe(){
          return fetch(this.url)
            .then((response) => {
              if (response.ok) {
                return response.json()
              } else {
                return Promise.reject(new Error(`${response.url}: ${response.status}`))
              }
            })
            .then((data) => {
              const newSeasons = data.data.result;
              this.seasons = [...this.seasons, ...newSeasons];
              if (this.pages <= 0) {
                const count = data.data.count;
                this.pages = Math.ceil(count / newSeasons.length);
              }
              this.page++;
              log('Load successfully ^.^')
            })
            .catch(error => {
              log(error)
            })
        },
        formateTag(season){
          let tag='';   //标签内容
          if(season.is_finish === 0){
              if(season.newest_ep_index === -1){
                tag = '未放送';
              }else{
                //有的番剧的total_count会成为-1， 所以出现这种情况就不保留total_count了
                tag = (season.total_count === -1)? season.newest_ep_index: season.newest_ep_index+'/'+season.total_count;
              }
          }else{
            tag = season.total_count+'集全';
          }
          return tag;
        },
        onmouseover(){
          this.show = true;
        },
        onmouseleave(){
          this.show = false;
        },
        onscroll(){
          if(this.loadflag
            && this.page <= this.pages
            && this.$refs.list.scrollHeight - this.$refs.list.scrollTop - 50 <=  this.$refs.list.clientHeight
            ){
            this.loadflag = false;  // refuse to load
            this.getSubscribe();
          }
        }
      },
      template: `
        <li 
          id="subscribe"
          class="nav-item"
          @mouseover.once="onmouseover"
          @mouseleave="onmouseleave"
        >
          <a id="subscribe-link"
            class="t"
            :href="href"
            @mouseover="onmouseover">
            订阅
          </a>
          <transition name="slide-fade">
            <div id="subscribe-list"
              :class="{ 'isActive': show }"
              v-if="show" 
              @scroll.stop="onscroll"
              ref="list">
              <ul>
                <li v-for="season in seasons">
                <a :href="season.share_url" target="_blank">
                  <img :src="season.cover" alt="" class="season-cover" />
                  <span class="season-name">
                    {{ season.title }}
                  </span>
                  <span class="season-tag">
                    {{ formateTag(season) }}
                  </span>
                </a>
                </li>
              </ul>
            </div>
          </transition>
        </li>
      `,
    });
  }

  /**
   * get nav list on the right of header
   * @param {Function} main 
   */
  function getNavList (main) {
    const navList = document.body.querySelector('div.nav-wrapper-right .nav-con .nav-con-ul');
    if(isNavList(navList)){
      log('Get nav menu list directly');
      main(navList);
    } else {
      const navListWrapper = document.querySelector('div.nav-wrapper-right .nav-con');
      if (navListWrapper) {
        const observer = new MutationObserver((mutations, ovserver) => {
          for (const mutation of mutations) {
            if(mutation.addedNodes.length>0){
              const addedNode = mutation.addedNodes[0];
              if(isNavList(addedNode)){
                log('Get nav menu list by observing');
                main(addedNode);
                ovserver.disconnect();
                break;
              }  
            }
          }
        });
        observer.observe(navListWrapper, {
          childList: true,
          subtree: false,
        });
      } else {
        const timer = setInterval(() => {
          const navList = document.body.querySelector('div.nav-wrapper-right .nav-con .nav-con-ul');
          if (navList) {
            main(navList);
            clearInterval(timer);
          }
        }, 300);
      }
    }
  }

  /**
   * get nav list for old version page
   * @param {*} main 
   */
  function getOldNavList(main) {
    const navList = document.querySelector('div.nav-con.fr>ul.fr');
    if(navList){
      main(navList);
      log('Get nav menu list');
    }else{
      const timer = setInterval(() => {
        const navList = document.body.querySelector('div.nav-con.fr>ul.fr');
        if (navList) {
          main(navList);
          clearInterval(timer);
        }
      }, 300);
    }
  }

  /**
   * check if specified node is the nav list
   * @param {*} node 
   */
  function isNavList(node) {
    if (
      node
      && node.tagName
      && node.tagName.toLowerCase() === 'ul'
      && node.classList.contains('nav-con-ul')  
    ) {
      return true;
    }
    return false;
  }

  /**
   * @returns void
   */
  function style() {
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    const listNewVersionOffset = '-200px';
    const listOldVersionOffset = '-101px';
    const newVersion = isNewPlayerPage(PATH);

    style.textContent = `
      #subscribe-list{
        width: 250px;
        height: 340px;
        overflow-y: auto;
        position: absolute;
        top: 100%;
        left: ${newVersion ? listNewVersionOffset : listOldVersionOffset};
        border-radius:  0 0 4px 4px;
        background: #fff;
        box-shadow: rgba(0,0,0,0.16) 0 2px 4px;
        text-align: left;
        font-size: 12px;
        z-index: ${newVersion ? 'unset' : 1};
        transition: all .3s ease-out .25s;
      }

      #subscribe-list>ul>li{
        height: 42px;
      }
      #subscribe-list>ul>li>a{
        color: #222;
        height: 42px;
        width: 100%;
        display: inline-flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      }
      #subscribe-list>ul>li>a:hover{
        color: #00a1d6;
        background: #e5e9ef;
      }
      #subscribe-list .season-cover{
        width: 30px;
        height: 40px;
        border-radius: 3px;
        margin-left: 8px;
        vertical-align: text-bottom;
      }
      #subscribe-list .season-name{
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
        display: inline-block;
        max-width: 120px;
        padding-left: 10px;
      }
      #subscribe-list .season-tag{
        margin-left: auto;
        margin-right: 10px;
        background: #ff8eb3;
        color: #fff;
        padding: 0 5px;
        display: inline-block;
        height: 18px;
        border-radius: 9px;
        vertical-align: middle;
        line-height: 18px;
      }
    `;
    head.appendChild(style);
  }

  /**
   * Get cookie by name
   * @param {string} name 
   */
  function getCookie(name){
    const value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length == 2) {
      return parts.pop().split(";").shift();
    }
    return '';
  }

  
  function isVideoPlayerPage(path) {
    return /.*video\/av.*/.test(path);
  }

  function isBangumiPlayerPage(path) {
    return /.*\/play\/.+/.test(path);
  }

  function isNewVideoPlayerPage(path) {
    return isVideoPlayerPage(path) && getCookie('stardustvideo') === '1';
  }

  function isNewBangumiPlayerPage(path) {
    return isBangumiPlayerPage(path) && getCookie('stardustpgcv') === '0606';
  }

  /**
   * Test url path is media player page
   * @returns {boolean}
   */
  function isNewPlayerPage(path) {
    return isNewVideoPlayerPage(path) || isNewBangumiPlayerPage(path);
  }

  /**
   * print something in console with custom style
   * @param {*} stuff 
   */
  function log(stuff) {
    console.log('%cbilibili订阅+:', 'background: #f25d8e; border-radius: 3px; color: #fff; padding: 0 8px', stuff);
  }
})();
