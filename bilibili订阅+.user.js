// ==UserScript==
// @name         bilibili订阅+
// @namespace    http://tampermonkey.net/
// @version      0.2.3
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

    cssStyleInit();
    /*导航栏添加订阅按钮*/
    $("ul.menu>li:nth-child("+index+")").after(`<li id="i_menu_sub_btn" class="u-i"><a class="i-link" href="//space.bilibili.com/`+mid+`/#!/bangumi" target='_blank'>订阅</a></li>`);
    /*订阅按钮添加下拉列表*/
    $("li#i_menu_sub_btn").append(`
        <div class="dyn_wnd" id="subscrptionList">
            <div class="dyn_arrow"></div>
            <div class="dyn_menu">
                <div class="menu" id="subListMenu"></div>
            </div>
        </div>
    `);
    var subscrptionList = $("#subscrptionList");        //获取列表节点

    /*获取订阅列表并添加到dom*/
    $.getJSON('http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage, function(data){
        var items = [];
        var newestEpisode = '';     // 最新集
        window.pages = data.data.pages;        //将总页数保存在全局变量里
        $.each( data.data.result, function( key, val ) {
            newestEpisode = (val.is_finish === 0)? val.newest_ep_index : val.total_count;
            items.push(`
                <li>
                    <a href="`+val.share_url+`" target="_blank">
                    `+val.title+`
                    <span class="sp">
                    `+newestEpisode+`
                    </span>
                    </a>
                </li>
            `);
        });
        $( "<ul/>", {
            html: items.join( "" )
        }).appendTo( "#subListMenu" );
    });
    /**
     * 订阅列表绑定scroll事件
     * 
     * 这里设置一个加载标志位：由于异步加载，在subListMenu还没有生成时，在页面底部会频繁触发ajax请求
     */
    var loadingFlag = 1;    // loadingFlag = 1 时允许加载
    subscrptionList.scroll(function(){
        if($(this).innerHeight()+ $(this).scrollTop() + 50 >= $(this)[0].scrollHeight && loadingFlag == 1){
            currentPage++;
            loadingFlag = 0;    // loadingFlag = 0 时禁止加载
            if(currentPage <= window.pages){
                $.getJSON('http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage, function(data){
                    var items = [];
                    var newestEpisode = '';
                    $.each( data.data.result, function( key, val ) {
                        newestEpisode = (val.is_finish === 0)? val.newest_ep_index : val.total_count;   // 最新集数
                        items.push(`
                            <li>
                                <a href="`+val.share_url+`" target="_blank">
                                `+val.title+`
                                <span class="sp">
                                `+newestEpisode+`
                                </span>
                                </a>
                            </li>
                        `);
                    });
                    $( "<ul/>", {
                        "class": "",
                        html: items.join( "" )
                    }).appendTo( "#subListMenu" );
                    loadingFlag = 1;
                });
            }
        }
    });
    /**
     * 获取cookie
     * @param {*} cname 
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
                width: 220px;
                height: 340px;
                overflow-y: auto;
                position: absolute;
                top: 42px;
                left: -86px;
                border-radius:  0 0 4px 4px;
                visibility: hidden;
                background: #fff;
                box-shadow: rgba(0,0,0,0.16) 0 2px 4px;
                text-align: center;
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
            #subListMenu>ul>li a{
                display:block;
            }
            #subListMenu>ul>li a:hover{
                color: #00a1d6;
                background: #e5e9ef;
            }
            #subListMenu>ul>li span.sp{
                background: #ff8eb3;
                color: #fff;
                text-align: center;
                padding: 0 5px;
                margin-right: 5px;
                border-radius: 9px;
                display: inline-block;
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