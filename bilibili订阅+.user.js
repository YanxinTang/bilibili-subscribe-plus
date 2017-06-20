// ==UserScript==
// @name         bilibili订阅+
// @namespace    http://inkbottle.site/
// @version      0.3.1
// @description  bilibili导航添加订阅按钮以及订阅列表
// @author       inkbottle
// @match        http://*.bilibili.com/*
// @grant        none
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
    var currentPage = 1;                  //定义当前页面为订阅列表第一页
    var jsonUrl = 'http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage;
    
    cssStyleInit();     // css样式插入

    var menu = document.body.querySelectorAll('ul.menu')[0];
    menu.insertBefore(createMenuSubBtn(), menu.childNodes[index]);

    ajaxGet(jsonUrl, function(){
        var data = JSON.parse( this).data;    //返回数据
        window.pages = data.pages;        //将总页数保存在全局变量里
        var ul = document.createElement("ul");
        data.result.forEach(function(element) {
            ul.appendChild(createLiNode(element));
        }, this);
        document.getElementById('subListMenu').appendChild(ul);
    });
    
    /**
     * 滚动列表动态加载
     * 
     * 这里设置一个加载标志位 loadingFlag：由于异步加载，在subListMenu还没有生成时，在页面底部会频繁触发ajax请求
     */
    var subscrptionList = document.getElementById('subscrptionList');
    var loadingFlag = 1;    // loadingFlag = 1 时允许加载
    subscrptionList.onscroll = function(){
        if($(this).innerHeight()+ $(this).scrollTop() + 50 >= $(this)[0].scrollHeight && loadingFlag == 1){
            currentPage++;
            jsonUrl = 'http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage;
            loadingFlag = 0;    // loadingFlag = 0 时禁止加载
            if(currentPage <= window.pages){
                ajaxGet(jsonUrl, function(){
                    var data = JSON.parse( this).data;    //返回数据
                    window.pages = data.pages;        //将总页数保存在全局变量里
                    var ul = document.createElement("ul");
                    data.result.forEach(function(element) {
                        ul.appendChild(createLiNode(element));
                    }, this);
                    document.getElementById('subListMenu').appendChild(ul);
                    loadingFlag = 1;
                });
            }
        }
    };
    /**
     * 生成导航链接按钮
     */
    function createMenuSubBtn(){
        var li = document.createElement("li"),
            subList = document.createElement("div"),
            dyn_menu = document.createElement("div"),
            subListMenu = document.createElement("div");
        setAttributes(li, {
            "id": "i_menu_sub_btn",
            "class": "u-i"
        });
        li.appendChild((function(){
            var a = document.createElement("a");
            setAttributes(a, {
                "class": "i-link",
                "href": "//space.bilibili.com/"+mid+"/#!/bangumi",
                "target": "_blank",
            });
            a.appendChild(document.createTextNode('订阅'));
            return a;
        })());
        setAttributes(subList, {
            "id": "subscrptionList",
            "class": "dyn_wnd"
        });
        dyn_menu.setAttribute("class", "dyn_menu");
        setAttributes(subListMenu, {
            "id": "subListMenu",
            "class": "menu"
        });
        dyn_menu.appendChild(subListMenu);
        subList.appendChild(dyn_menu);
        li.appendChild(subList);
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
            // 链接文字
            a.appendChild((function(){
                var titleWrapper = document.createElement("span");
                titleWrapper.setAttribute("class", "titleWrapper");
                titleWrapper.appendChild(document.createTextNode(data.title));
                return titleWrapper;
            })());
            // 链接集数标签
            a.appendChild((function(){
                var spWrapper = document.createElement("span");
                // 这个wrapper是为了让tag右浮且垂直居中
                spWrapper.setAttribute("class", "spWrapper");
                spWrapper.appendChild((function(){
                    var sp = document.createElement("span");
                    sp.setAttribute("class", "sp");
                    sp.appendChild(document.createTextNode((data.is_finish === 0)? data.newest_ep_index : data.total_count));
                    return sp;
                })());  // spWrapper.appendChild End
                return spWrapper;
            })());  // a.appendChild End
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
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                callback.call(this.responseText);
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
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
        return "";
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
            #subscrptionList{
                width: 200px;
                height: 340px;
                overflow-y: auto;
                position: absolute;
                top: 42px;
                left: -76px;
                border-radius:  0 0 4px 4px;
                visibility: hidden;
                background: #fff;
                box-shadow: rgba(0,0,0,0.16) 0 2px 4px;
                text-align: left;
                font-size: 12px;
                z-index: 7000;
                transition-delay: 0.5s;
                -moz-transition-delay: 0.5s; /* Firefox 4 */
                -webkit-transition-delay: 0.5s; /* Safari 和 Chrome */
                -o-transition-delay: 0.5s; /* Opera */
            }
            #i_menu_sub_btn>a:hover + #subscrptionList{
                visibility: visible;
                transition-delay: 0.5s;
                -moz-transition-delay: 0.5s; /* Firefox 4 */
                -webkit-transition-delay: 0.5s; /* Safari 和 Chrome */
                -o-transition-delay: 0.5s; /* Opera */
            }
            #subscrptionList:hover{
                visibility: visible;
            }
            #subListMenu>ul>li::after{
                content:"";
                display: block;
                clear: both;
            }
            #subListMenu>ul>li a:hover{
                color: #00a1d6;
                background: #e5e9ef;
            }
            #subListMenu>ul>li a{
                height: 42px;
                display: block;
            }
            #subListMenu>ul>li a>.titleWrapper{
                text-overflow: ellipsis; 
                overflow: hidden; 
                white-space: nowrap;
                display: inline-block;
                max-width: 120px;
                padding-left: 10px; 
            }
            #subListMenu>ul>li span.spWrapper{
                float: right;
            }
            #subListMenu>ul>li span.sp{
                background: #ff8eb3;
                color: #fff;
                text-align: center;
                padding: 0 5px;
                margin-right: 5px;
                border-radius: 9px;
                height: 18px;
                line-height: 17px;
            }
        `;
        head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'data:text/css,' + escape(css);  // IE needs this escaped
        head.appendChild(link);
    }
})();