// ==UserScript==
// @name         bilibili订阅+
// @namespace    http://tampermonkey.net/
// @version      0.1.1
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
    /*导航栏添加订阅按钮*/
    $("ul.menu>li:nth-child("+index+")").after(`<li id="i_menu_sub_btn" class="u-i" style="display: list-item;"><a class="i-link" href="//space.bilibili.com/`+mid+`/#!/bangumi" target='_blank'>订阅</a></li>`);
    /*订阅按钮添加下拉列表*/
    $("li#i_menu_sub_btn").append(`
        <div class="dyn_wnd" id="subscrptionList">
            <div class="dyn_arrow"></div>
            <div class="dyn_menu">
                <div class="menu" id="subListMenu"></div>
            </div>
        </div>
    `);
    var subscrptionList = $("#subscrptionList");        //获取列表dom
    subscrptionList.css({
        "width":"180px",
        "height":"340px",
        "overflow-y":"auto",
        "position":"absolute",
        "top":"42px",
        "left":"-66px",
        "border-radius":" 0 0 4px 4px",
        "display":"none",
        "background":"#fff",
        "box-shadow":"rgba(0,0,0,0.16) 0 2px 4px",
        "text-align":"center",
        "font-size":"12px",
        "z-index":"7000"
    });
    /*订阅按钮hover事件*/
    $("#i_menu_sub_btn").hover(
        function() {
            subscrptionList.css("display","block");
        }, 
        function(){
            subscrptionList.css("display","none");
    });
    /*获取订阅列表并添加到dom*/
    $.getJSON('http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage, function(data){
        var items = [];
        window.pages = data.data.pages;        //将总页数保存在全局变量里
        $.each( data.data.result, function( key, val ) {
            items.push( "<li><a href='"+val.share_url+"'target='_blank'>"+val.title+"</a></li>" );
        });
        $( "<ul/>", {
            "class": "",
            html: items.join( "" )
        }).appendTo( "#subListMenu" );
    });
    /*订阅列表绑定scroll事件*/
    subscrptionList.scroll(function(){
        if($(this).innerHeight()+ $(this).scrollTop() >= $(this)[0].scrollHeight){
            currentPage++;
            if(currentPage <= window.pages){
                $.getJSON('http://space.bilibili.com/ajax/Bangumi/getList?mid='+mid+'&page='+currentPage, function(data){
                    var items = [];
                    $.each( data.data.result, function( key, val ) {
                        items.push( "<li><a href='"+val.share_url+"'target='_blank'>"+val.title+"</a></li>" );
                    });
                    $( "<ul/>", {
                        "class": "my-new-list",
                        html: items.join( "" )
                    }).appendTo( "#subListMenu" );
                });
            }
        }
    });
    /*获取cookie*/
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
})();

