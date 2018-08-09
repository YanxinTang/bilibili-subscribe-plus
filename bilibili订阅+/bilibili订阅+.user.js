// ==UserScript==
// @name         bilibili订阅+
// @namespace    https://github.com/YanxinTang/Tampermonkey
// @version      0.4.1
// @description  bilibili导航添加订阅按钮以及订阅列表
// @author       tyx1703
// @include      *.bilibili.com/*
// @license      MIT
// ==/UserScript==

(function() {
  'use strict';

  let main = function(nav_list){
    // append subscribe item to nav list

    let subscribe_node = document.createElement('li');
    subscribe_node.setAttribute('id', 'subscribe');
    subscribe_node.setAttribute('class', 'nav-item');
    subscribe_node.innerHTML = `
      <a :href="href" id="subscribe-link" class="t" 
        v-on:mousemove="onHover">订阅</a>
      <div id="subscribe-list" 
        :class="{ 'fade-active': isActive }"
        @mouseleave="noHover"
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
              {{ formate_tag(season) }}
            </span>
          </a>
          </li>
        </ul>
      </div>
    `;
    nav_list.appendChild(subscribe_node);

    let subscribe = new Vue({
      el: '#subscribe-list',
      data: {
        isActive: false,
        seasons: [],
        loadflag: true,
        pages: 1,             // count of pages
        page: 1,              // current page
      },
      mounted(){
        this.get_subscribe();
      },
      updated(){
        this.loadflag = true; // allow loading after update data
      },
      computed: {
        url(){
          return `//space.bilibili.com/ajax/Bangumi/getList?mid=${this.mid}&page=${this.page}`;
        },
        mid(){
          return this.get_cookie('DedeUserID');
        }
      },
      methods: {
        get_cookie(name){
          const value = "; " + document.cookie;
          let parts = value.split("; " + name + "=");
          if (parts.length == 2) {
            return parts.pop().split(";").shift();
          }
          return undefined;
        },
        get_subscribe(){
          console.log(this.url);
          this.$http.get(this.url).then((response) => {
            console.log(response.body);
            this.seasons = [...this.seasons, ...response.body.data.result];
            this.pages = response.body.data.pages;
            this.page++;
            // get body data
          }, (response) => {
            // error callback
            console.log('error');
          });
        },
        formate_tag(season){
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
        noHover(){
          this.isActive = false;
        },
        onscroll(){
          if(this.loadflag
            && this.page <= this.pages
            && this.$refs.list.scrollHeight - this.$refs.list.scrollTop - 50 <=  this.$refs.list.clientHeight
            ){
            this.loadflag = false;  // refuse to load 
            this.get_subscribe();
          }
        }
      }
    });

    let subscribe_link = new Vue({
      el: '#subscribe-link',
      computed: {
        href(){
          return `//space.bilibili.com/${subscribe.mid}/#!/bangumi`;
        }
      },
      methods: {
        onHover(){
          console.log('mouseover');
          subscribe.isActive = true;
        }
      }
    });
  }

  /**
   * get the ul node of nav list item. It will be called agter jquery and vue loaded in init_lib
   * @return {[type]} null
   */
  
  let get_nav_list = function(callback){
    console.log('vue-resource has bing loaded');

    let nav_list = document.querySelector('div.nav-con.fr>ul.fr');
    if(nav_list){
      main(nav_list);
    }else{
      let bilibili_wrapper = document.querySelector('div.nav-con.fr');
      let observer = new MutationObserver(function (mutations, observer) {
        mutations.forEach(function(mutation) {
          if(mutation.addedNodes.length>0 && mutation.addedNodes[0].classList.contains('fr')){
            main(mutation.addedNodes[0]);
            observer.disconnect();
          }
        });
      });
      observer.observe(bilibili_wrapper, {
        'childList': true,
      });
    }
  }

  /**
   * @param  {Function} callback callback function when jquery and vue is loaded
   * @return {[type]} null
   */
  function lib_loader(callback) {
    let head = document.head || document.getElementsByTagName('head')[0];
    let jquery_node = document.createElement('script');
    jquery_node.setAttribute("src", "//cdn.bootcss.com/vue/2.5.16/vue.js");

    jquery_node.addEventListener('load', function() {
      console.log('Vue has bing loaded');
      let vue_node = document.createElement('script');
      vue_node.setAttribute("src", "//cdn.bootcss.com/vue-resource/1.5.1/vue-resource.min.js");
      vue_node.addEventListener('load', callback, false);
      head.appendChild(vue_node);
    }, false);

    head.appendChild(jquery_node);
  }

  /**
   * @return {undifined}  
   */
  function style(){
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    style.textContent = `
      #subscribe-list{
        width: 250px;
        height: 340px;
        overflow-y: auto;
        position: absolute;
        top: 46px;
        left: -101px;
        border-radius:  0 0 4px 4px;
        visibility: hidden;
        opacity: 0;
        background: #fff;
        box-shadow: rgba(0,0,0,0.16) 0 2px 4px;
        text-align: left;
        font-size: 12px;
        z-index: 7000;
        transition: all .3s ease-out .25s;
      }
      #subscribe-list.fade-active:hover,#subscribe>a:hover + #subscribe-list{
        visibility: visible;
        opacity: 1;
        top: 42px;
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
   * @param  {[string]} name  name of cookie
   * @return {[string]} string of specified cookie 
   */
  
  lib_loader(get_nav_list); 
  style();
})();