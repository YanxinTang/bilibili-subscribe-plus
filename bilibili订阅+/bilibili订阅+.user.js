// ==UserScript==
// @name         bilibili订阅+
// @namespace    https://tangxin.me/
// @version      0.3.21
// @description  bilibili导航添加订阅按钮以及订阅列表
// @author       vector
// @include      *.bilibili.com/*
// @connect      space.bilibili.com
// @grant        GM.xmlHttpRequest
// @license MIT
// ==/UserScript==

(function() {
    /**
     * 如果您想自定义订阅栏目所在的位置，您可以修改 index 变量来实现这一效果
     * index = 2 : 插入“头像”之后
     * index = 3 : 插入“消息”之后
     * index = 4 : 插入“动态”之后
     * index = 5 : 插入“收藏夹”之后
     * ...
     * index = 8 : 投稿
     */

    var index = 2;
    // 请勿更改
    var mid = getCookie('DedeUserID');    //从cookie获取用户mid
    var pages;                     // 总页数
    var page = 1;                  // 待请求页数，默认为第一页
    if(mid === -1) return console.log("请登陆后使用");

    // var jsonUrl = '//space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage;

    cssStyleInit();     // css样式插入
    var bilibili_wrapper = document.querySelector('div.nav-con.fr');
    var ul = bilibili_wrapper.getElementsByClassName('fr')[0];

    if(ul !== undefined){
        ul.insertBefore(createMenuSubBtn(), ul.childNodes[index+1]);
        genSubList()
    }else{
        var observer = new MutationObserver(function (mutations, observer) {
            mutations.forEach(function(mutation) {
                try{
                    var ul = mutation.addedNodes[0];
                    ul.insertBefore(createMenuSubBtn(), ul.childNodes[index]);
                    genSubList();
                }catch(e){
                    console.log(e);
                }
            });
        });
        observer.observe(bilibili_wrapper, {
            'childList': true
        });
    }
    function genSubList(){
        
        // 从api加载第一页的内容
        ajaxGet(getJsonUrl(mid, page), function(result){
            var data = JSON.parse(result).data;    //返回数据
            pages = data.pages;        //将总页数保存
            var ul = document.getElementById('sub-list');
            data.result.forEach(function(element) {
                ul.appendChild(createLiNode(element));
            }, this);
        });
        /**
         * 滚动列表动态加载
         *
         * 这里设置一个加载标志位 loadingFlag：由于异步加载，在subListMenu还没有生成时，在页面底部会频繁触发ajax请求
         */
        var subListWrapper = document.getElementById('sub-list-wrapper');
        var loadingFlag = 1;    // loadingFlag = 1 时允许加载
        subListWrapper.onscroll = function(){
            if(this.clientHeight+ this.scrollTop + 150 >= this.scrollHeight && loadingFlag == 1){
                page++;
                loadingFlag = 0;    // loadingFlag = 0 时禁止加载
                if(page <= pages){
                    ajaxGet(getJsonUrl(mid, page), function(result){
                        var data = JSON.parse(result).data;    //返回数据
                        var ul = document.getElementById('sub-list');
                        data.result.forEach(function(element) {
                            ul.appendChild(createLiNode(element));
                        }, this);
                        loadingFlag = 1;
                    });
                }
            }
        };
    }
    /**
     * 获取番剧列表api地址
     *
     * @param {any} mid
     * @param {any} page
     * @returns
     */
    function getJsonUrl(mid, page) {
        page = page || 1;
        return 'https://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+page;
    }
    /**
     * 生成导航链接按钮
     */
    function createMenuSubBtn(){
        var li = document.createElement("li");
        var subList = document.createElement("div");
        var subLink = document.createElement("a");
        var ul = document.createElement("ul");
        setAttributes(li, {
            "id": "i_menu_sub_btn",
            "class": "nav-item"
        });
        setAttributes(subLink, {
            "class": "t",
            "href": "//space.bilibili.com/"+mid+"/#!/bangumi",
            "target": "_blank",
        });
        subLink.appendChild(document.createTextNode('订阅'));
        li.appendChild(subLink);
        setAttributes(subList, {
            "id": "sub-list-wrapper",
            "class": "dyn_wnd"
        });
        ul.setAttribute('id', 'sub-list');
        subList.appendChild(ul);
        li.appendChild(subList);

        subLink.onmousemove = function(){
            subList.classList.add("fade-active");
        }
        subList.onmouseleave = function(){
            subList.classList.remove("fade-active");
        }
        return li;
    }
    /**
     * 生成番剧列表li节点
     * @param {object} data // 番剧详细数据
     */
    function createLiNode(data){
        var li = document.createElement("li");
        // 番剧链接
        li.appendChild((function(){
            var a = document.createElement("a");
            setAttributes(a, {
                "href": data.share_url,
                "target": "_blank"
            });
            var cover = document.createElement('img');
            setAttributes(cover,{
                "class": "cover",
                "src": data.cover
            });
            // 番剧链接文字
            var titleWrapper = document.createElement("span");
            titleWrapper.setAttribute("class", "titleWrapper");
            titleWrapper.appendChild(document.createTextNode(data.title));

            // 链接集数标签
            var sp = document.createElement("span");
            sp.setAttribute("class", "sp");
            var spanText;   //标签内容
            if(data.is_finish === 0){
                if(data.newest_ep_index === -1){
                    spanText = '未放送';
                }else{
                    //有的番剧的total_count会成为-1， 所以出现这种情况就不保留total_count了
                    spanText = (data.total_count === -1)? data.newest_ep_index: data.newest_ep_index+'/'+data.total_count;
                }
            }else{
                spanText = data.total_count+'集全';
            }
            sp.appendChild(document.createTextNode(spanText));

            a.appendChild(cover);
            a.appendChild(titleWrapper);
            a.appendChild(sp);
            return a;
        })()); // li.appendChild End
        return li;
    }
    /**
     * 设置节点属性值
     * @param {object} el
     * @param {array} attrs
     */
    function setAttributes(el, attrs) {
        for(var key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    }
    /**
     * ajax 获取数据
     * @param {string} url
     * @param {*} callback
     */
    function ajaxGet(url, callback){
        if(typeof GM === "undefined"){
            // Tampermonkey 下面GM为 undefined
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    callback(this.responseText);
                }
            };
            xhttp.withCredentials = true;
            xhttp.open("GET", url, true);
            xhttp.send();
        }else{
            // Greasemonkey
            GM.xmlHttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    callback(response.responseText);
                }
            });
        }
    }
    /**
     * 获取cookie
     * @param {string} cname
     */
    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return -1;  // 没有cookie返回-1
    }
    /**
     * css样式初始化
     */
    function cssStyleInit(){
        // css样式
        var css = `
            #i_menu_sub_btn{
                display: list-item;
            }
            #sub-list-wrapper{
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
            #sub-list-wrapper.fade-active:hover,#i_menu_sub_btn>a:hover + #sub-list-wrapper{
                visibility: visible;
                opacity: 1;
                top: 42px;
            }
            #sub-list-wrapper>ul>li{
                max-height: 42px;
            }
            #sub-list-wrapper>ul>li a:hover{
                color: #00a1d6;
                background: #e5e9ef;
            }
            #sub-list-wrapper>ul>li a{
                color: #222;
                height: 42px;
                width: 100%;
                display: inline-flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
            }
            #sub-list-wrapper>ul>li .cover{
                width: 30px;
                height: 40px;
                border-radius: 3px;
                margin-left: 8px;
            }
            #sub-list-wrapper>ul>li a>.titleWrapper{
                text-overflow: ellipsis;
                overflow-x: hidden;
                white-space: nowrap;
                display: inline-block;
                max-width: 120px;
                padding-left: 10px;
            }
            #sub-list-wrapper>ul>li span.spWrapper{
                margin-left: auto;
            }
            #sub-list-wrapper>ul>li span.sp{
                background: #ff8eb3;
                color: #fff;
                text-align: center;
                padding: 0 5px;
                margin-right: 5px;
                margin-left: auto;
                border-radius: 9px;
                height: 18px;
                line-height: 18px;
            }
        `;
        head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'data:text/css,' + escape(css);  // IE needs this escaped
        head.appendChild(link);
    }
})();