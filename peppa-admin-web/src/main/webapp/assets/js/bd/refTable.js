require(["refCommon"], function () {
    var curPage = {
        initPage: function () {
            var //colModelUrl = "http://" + window.location.host + App.contextPath + "/bd/getTableInfo.json?token=" + userInfoUtil.getToken(),
                colModelUrl = "http://" + window.location.host + App.contextPath + "/bd/getTableInfo.json",
                dataUrl = "http://" + window.location.host + App.contextPath + "/bd/getTableData.json",
                props = App.props,
                postData = {
                    refCon: {                        
                        businessType: props.businessType,
                        sqlType: $.isFunction(props.sqlType) && props.sqlType() || props.sqlType,
                        sqlData: $.isFunction(props.sqlData) && props.sqlData() || props.sqlData
                    }
                };

            $(".sj-table-tab").sjTableTab({
                colModelUrl: colModelUrl,
                colModelUrlPostData: postData,
                dataUrl: dataUrl,
                dataUrlPostData: postData,
                multiple: props.multiple
            });

            //打开窗口时，当已有选择数据时，则将第1页选择的选中
            if (props.selectedData) {
                $(".sj-table-tab").sjTableTab("selectForFirstTab", props.selectedData);
            }
        },

        reload: function () {
            var
                $tab = $(".sj-table-tab"),
                $grid1 = $tab.sjTableTab("getFirstGrid");

            $tab.eyTabs("select", 0);//切换到第1个tab
            $grid1.trigger("reloadGrid");
        },

        search: function () {
            var
                $tab = $(".sj-table-tab"),//切换到第1个tab
                $grid1 = $tab.sjTableTab("getFirstGrid"),
                url = $grid1.jqGrid("getGridParam", "url"),
                postData = $grid1.jqGrid("getGridParam", "postData"),
                matchValue = $("#matchValue").val();

            postData["refCon"]["matchValue"] = matchValue;
            $grid1.jqGrid("setGridParam", {url: url, page: 1, postData: postData}).trigger("reloadGrid");
        },

        bindEvent: function () {
            $(document)
                .off("click.ref.minus").on("click.ref.minus", ".sj-icon-minus", function (event) {
                    var
                        $target = $(event.target),
                        rowId = $target.closest("tr")[0].id,
                        $tabTable = $target.closest(".sj-table-tab");

                    $tabTable.sjTableTab("delRow", rowId);
                })
                .off("click.ref.search").on("click.ref.search", "#search", function () {
                    curPage.search();
                })
                .off("keypress.ref.search").on("keypress.ref.search", "#matchValue", function (event) {
                    if (event.keyCode === 13) {
                        curPage.search();
                    }
                })
                .off("click.ref.reaload").on("click.ref.reaload", "#reload", function () {
                    curPage.reload();
                });
        },

        init: function () {
            var watchInit = window.setInterval(function () {
                if (App.needInit) {
                    watchInit = null;
                    App.needInit = false;
                    curPage.initPage();
                }
            }, 5);
        }

    };

    curPage.init();
    curPage.bindEvent();
});
