// ==UserScript==
// @name         bilibili订阅+
// @namespace    https://github.com/YanxinTang/Tampermonkey
// @version      0.6.4
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

  style();
  getNavList().then(navList => main(navList));

  function main(navList) {
    const subscribeMenuEl = document.createElement('div');
    subscribeMenuEl.setAttribute('id', 'subscribe');
    navList.appendChild(subscribeMenuEl);

    const ListItem = {
      name: 'ListItem',
      props: {
        link: {
          type: String,
          required: true,
        },
        cover: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true,
        },
        tag: {
          type: String,
          required: true,
        }
      },
      template: `
      <li>
        <a :href="link" target="_blank">
          <img :src="cover" :alt="title" class="season-cover" />
          <span class="season-name">
            {{ title }}
          </span>
          <span class="season-tag">
            {{ tag }}
          </span>
        </a>
      </li>
      `,
    }

    const List = {
      name: 'List',
      components: { ListItem },
      props: {
        list: {
          type: Array,
          default: () => [],
        }
      },
      template: `
      <ul ref="list">
        <ListItem
          v-for="item in list"
          :key="item.id"
          :link="item.link"
          :cover="item.cover"
          :title="item.title"
          :tag="item.tag"
        />
      </ul>
      `,
    }

    const subscribe = new Vue({
      el: subscribeMenuEl,
      components: { List },
      data: {
        show: false,
        bangumis: [],
        cinemas: [],
        floowings: [],
        loadflag: true,
        pages: {
          bangumi: -1,
          cinema: -1,
          floowing: -1
        },             // count of pages
        page: {
          bangumi: 1,
          cinema: 1,
          floowing: 1
        },              // current page
        perPage: 15,
        mid: '',
        activeTab: 'bangumi',
        $_mouseOverTimer: null,
      },
      created() {
        this.mid = DedeUserID;
        this.getSubscribe(this.activeTab);
      },
      updated(){
        this.loadflag = true; // allow loading after update data
      },
      computed: {
        subscribePageLink() {
          return `//space.bilibili.com/${this.mid}/bangumi`;
        },
        list() {
          const key = this.activeTab;
          if (key === 'bangumi') { return this.bangumis };
          if (key === 'cinema') { return this.cinemas };
          if (key === 'floowing') { return this.floowings }
        },
        href(){
          const urls = {
            bangumi: `//space.bilibili.com/${this.mid}/bangumi`,
          }
          return urls[this.activeTab];
        }
      },
      methods: {
        dataKey(key) {
          if (key === 'bangumi') { return 'bangumis' };
          if (key === 'cinema') { return 'cinemas' };
          if (key === 'floowing') { return 'floowings' };
        },
        switchTab(key) {
          this.activeTab = key;
          const dataKey = this.dataKey(key);
          if (this[dataKey].length <= 0) {
            this.getSubscribe(key);
          }
        },
        getListData(key) {
          const page = this.page[key];
          const dataKey = this.dataKey(key);
          const urls = {
            bangumi: `//api.bilibili.com/x/space/bangumi/follow/list?type=1&follow_status=0&pn=${page}&ps=${this.perPage}&vmid=${this.mid}`,
            cinema: `//api.bilibili.com/x/space/bangumi/follow/list?type=2&follow_status=0&pn=${page}&ps=${this.perPage}&vmid=${this.mid}`,
          }
          const url = urls[key];
          return fetch(url, {
            method: 'GET',
            credentials: 'include',
          })
            .then((response) => {
              if (response.ok) {
                return response.json()
              } else {
                return Promise.reject(new Error(`${response.url}: ${response.status}`))
              }
            })
            .then((data) => {
              const newData = data.data.list.map(item => ({
                id: item.season_id || item.media_id || item.mid,
                link: item.url,
                cover: item.cover,
                title: item.title,
                tag: item.new_ep.index_show,
              }));
              this[dataKey] = [...this[dataKey], ...newData]
              if (this.pages[key] <= 0) {
                const total = data.data.total;
                this.pages[key] = Math.ceil(total / this.perPage);
              }
              this.page[key]++;
              log('Load successfully ^.^')
            })
            .catch(error => {
              log(error)
            })
        },
        getFloowings() {
          const key = 'floowing';
          const dataKey = this.dataKey(key);
          const page = this.page[key];
          const url = `//api.bilibili.com/x/relation/followings?vmid=${this.mid}&pn=${page}&ps=${this.perPage}&order=desc`;
          return fetch(url, {
            method: 'GET',
            credentials: 'include',
          })
            .then((response) => {
              if (response.ok) {
                return response.json()
              } else {
                return Promise.reject(new Error(`${response.url}: ${response.status}`))
              }
            })
            .then((data) => {
              const newData = data.data.list.map(item => ({
                link: `//space.bilibili.com/${item.mid}/`,
                cover: item.face,
                title: item.uname,
                tag: '已关注',
              }));
              this[dataKey] = [...this[dataKey], ...newData]
              if (this.pages[key] <= 0) {
                const total = data.data.total;
                this.pages[key] = Math.ceil(total / this.perPage);
              }
              this.page[key]++;
              log('Load successfully ^.^')
            })
            .catch(error => {
              log(error)
            })
        },
        getSubscribe(key) {
          switch (key) {
            case 'bangumi':
              this.getListData('bangumi');
              break;
            case 'cinema':
              this.getListData('cinema');
              break;
            case 'floowing':
              this.getFloowings();
            default: 
              break;
          }
        },
        onmouseover(){
          this.$data.$_mouseOverTimer = setTimeout(() => {
            this.show = true;
            clearInterval(this.$data.$_mouseOverTimer);
          }, 100);
        },
        onmouseleave(){
          this.show = false;
          clearInterval(this.$data.$_mouseOverTimer);
        },
        onscroll() {          
          const key = this.activeTab;
          const list = this.$refs.list.$refs.list;
          if(this.loadflag
            && this.page[key] <= this.pages[key]
            && list.scrollHeight - list.scrollTop - 50 <=  list.clientHeight
            ){
            this.loadflag = false;  // refuse to load
            this.getSubscribe(this.activeTab);
          }
        }
      },
      template: `
        <div class="item"
          @mouseover.once="onmouseover"
          @mouseleave="onmouseleave"
        >
          <a :href="subscribePageLink" target="_blank"><span class="name" @mouseover="onmouseover">订阅</span></a>
          <transition name="slide-fade">
            <div id="subscribe-list-wrapper"
              :class="{ 'isActive': show }"
              v-if="show">
              <div class="subscribe-list">
                <div class="tab-bar">
                  <div class="tab-item" :class="{ active: activeTab === 'bangumi' }" @click="switchTab('bangumi')">追番</div>
                  <div class="tab-item" :class="{ active: activeTab === 'cinema' }" @click="switchTab('cinema')">追剧</div>
                  <div class="tab-item" :class="{ active: activeTab === 'floowing' }" @click="switchTab('floowing')">关注</div>
                </div>
                <List :list="list" @scroll.native.stop="onscroll" ref="list"/>
              </div>
            </div>
          </transition>
        </div>
      `,
    })
  }

  /**
   * get nav list on the right of header
   * @param {Function} main 
   */
  function getNavList () {
    const userCenter = document.body.querySelector('.nav-user-center');
    return new Promise((resolve) => {
      if (userCenter) {
        const observer = new MutationObserver((mutations, observer) => {
          for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
              const addedNode = mutation.addedNodes[0];
              if(isNavList(addedNode)){
                log('Get nav menu list by observing');
                resolve(addedNode);
                observer.disconnect();
                break;
              }
            }
          }
        });
        observer.observe(userCenter, {
          childList: true,
          subtree: false,
        });
      } else {
        // Find user nav menu per 100ms
        const timer = setInterval(() => {
          const userNavMenu = document.body.querySelector('.nav-user-center>.user-con.signin');
          if (userNavMenu) {
            log('Get nav menu list by timer');
            resolve(userNavMenu);
            clearInterval(timer);
          }
        }, 100);
      }
    });
    
  }

  /**
   * check if specified node is the nav list
   * @param {*} node 
   * @returns {boolean}          - 
   */
  function isNavList(node) {
    if (
      node
      && node.tagName
      && node.tagName.toLowerCase() === 'div'
      && node.classList.contains('user-con') 
      && node.classList.contains('signin')
    ) {
      return true
    }
    return false;
  }

  /**
   * @returns void
   */
  function style() {
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');

    style.textContent += `
      #subscribe-list-wrapper {
        width: 250px;
        position: absolute;
        top: 100%;
        left: -110px;
        padding-top: 12px;
        text-align: left;
        font-size: 12px;
        z-index: 10;
        transition: all .3s ease-out .25s;
      }

      #subscribe-list-wrapper .tab-bar {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        font-size: 12px;
        color: #999;
        line-height: 16px;
        height: 48px;
        padding-left: 20px;
        user-select: none;
        border-bottom: 1px solid #e7e7e7;
        cursor: default;
      }

      #subscribe-list-wrapper .tab-bar .tab-item {
        display: flex;
        border-radius: 12px;
        cursor: pointer;
        margin: 0 24px 0 0;
        transition: 0.3s ease;
        z-index: 1;
      }

      #subscribe-list-wrapper .tab-bar .tab-item.active {
        background-color: #00a1d6;
        color: #fff;
        padding: 4px 10px;
        margin: 0 14px 0 -10px;
      }

      #subscribe-list-wrapper .subscribe-list {
        width: 100%;
        height: 100%;
        background: #fff;
        box-shadow: rgba(0,0,0,0.16) 0 2px 4px;
        border-radius:  2px;
      }

      .subscribe-list ul {
        max-height: 340px;
        overflow-y: auto;
      }
      .subscribe-list ul>li{
        height: 42px;
      }
      .subscribe-list ul>li>a{
        color: #222;
        height: 42px;
        width: 100%;
        display: inline-flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      }
      .subscribe-list>ul>li>a:hover{
        color: #00a1d6;
        background: #e5e9ef;
      }
      .subscribe-list .season-cover{
        width: 30px;
        height: auto;
        border-radius: 3px;
        margin-left: 8px;
        vertical-align: text-bottom;
      }
      .subscribe-list .season-name{
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
        display: inline-block;
        max-width: 120px;
        padding-left: 10px;
      }
      .subscribe-list .season-tag{
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

  /**
   * print something in console with custom style
   * @param {*} stuff 
   */
  function log(stuff) {
    console.log('%cbilibili订阅+:', 'background: #f25d8e; border-radius: 3px; color: #fff; padding: 0 8px', stuff);
  }
})();
