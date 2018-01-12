/**
 * 1.第一次调用时会将形如
 *      <input type="text" />
 * 包裹生如下形式
 *      <span class="sj-combotree">
 *          <input type="text" class="sj-valuefield"/>
 *          <button class="sj-btn">...</button>
 *      </span>
 * 并返回2）对象
 *  2.返回值 {
 *          main：->class 为sj-combotree的jquery对象
 *          btn:  ->class 为sj-btn的jquery对象
 *      }
 *  3.如果初始化为多个对象时，则返回第1对象的结果
 *  e.g.$(".abc）.sjWrapBtn(),因$(".abc）的length>1,只返回其中第一个的运行结果
 */
(function ($) {
    $.sj = $.sj || {};
    $.sj.wrapBtn = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.wrapBtn.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else {
                throw "No this Method:" + options;
            }
        }

        options = options || {};

        this.each(function () {
            var state = $.data(this, "wrapBtn");
            if (state) {
                $.extend(state.options, options);
                $.sj.wrapBtn.methods._create(this, true);
            } else {
                state = $.data(this, "wrapBtn", {
                    options: $.extend({}, $.sj.wrapBtn.defaults, $.sj.wrapBtn.parseOptions(this), options)
                });
                $.sj.wrapBtn.methods._create(this, false);
            }
        });
        return $.sj.wrapBtn.methods.get(this);
    };
    var classAndAtr = {
        combotree: "sj-wrapcontainer",
        valueField: "sj-valuefield",
        btn: "sj-btn",
        btnValue: "",
        del: "sj-del",
        delValue: ""
    };

    $.sj.wrapBtn.methods = {
        _create: function (target, hasCreated) {
            var $main, $valueField = $(target);

            if(!hasCreated) {
                $valueField.addClass(classAndAtr.valueField).wrap($.StringUtils.format("<span class='{0}'></span>", classAndAtr.combotree));
                $main = $valueField.closest("." + classAndAtr.combotree);
                $main.append($.StringUtils.format("<input type='button' class='{0}' value='{1}' title='清空'/>", classAndAtr.del, classAndAtr.delValue));
                $main.append($.StringUtils.format("<input type='button' class='{0}' value='{1}' title='选择' />", classAndAtr.btn, classAndAtr.btnValue));

                $main
                    .on("focusin", function () {
                        $(this).addClass("inp-active");
                    })
                    .on("focusout", function () {
                        $(this).removeClass("inp-active");
                    });
            }

            $valueField.sjWrapBtn("disabled", $valueField.sjWrapBtn("options").disabled);
        },

        /**
         * 禁用控件
         * @param jq
         * @param state 禁用状态
         */
        disabled: function(jq, state) {
            return jq.each(function () {
                var opts = $(this).sjWrapBtn('options'),
                    wrapEles = $(this).sjWrapBtn('get');

                wrapEles.btn.prop("disabled", state);
                opts.disabled = state;
            });
        },

        get: function (jq) {
            var $main = $(jq).closest("." + classAndAtr.combotree),
                btn = $main.find("." + classAndAtr.btn),
                del = $main.find("." + classAndAtr.del);

            return {
                main: $main,
                btn: btn,
                del: del
            };
        },

        options: function (jq) {
            return $.data(jq[0], 'wrapBtn').options;
        }
    };

    $.sj.wrapBtn.defaults = {
        disabled: false
    };

    $.sj.wrapBtn.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [ "disabled"]));
    };

    $.fn.sjWrapBtn = $.sj.wrapBtn;
})(jQuery);

/**
 * 参照显示框控件
 */
(function ($) {
    "use strict";

    var startsWith = function (str, searchString, position) {
            position = position || 0;
            return String(str).indexOf(searchString, position) === position;
        },
        placeCaretAtEnd = function (element) {
            if (element == null) {
                return;
            }
            element.focus();
            if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(element);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(element);
                textRange.collapse(false);
                textRange.select();
            }
        },
        pickoutItem = function (items) {
            if (items == null || ($.isArray(items) && items.length === 0)) {
                return [];
            }
            var itemArray = $.isArray(items) ? items : [items];
            return _.reject(itemArray, function (item) {
                return item == null || $.isEmptyObject(item);
            });
        };

    $.itemlist = $.itemlist || {};

    $.fn.itemlist = function (options, param) {
        if (typeof options == 'string') {
            var method = $.itemlist.methods[options];

            if (method && !startsWith(options, "_")) {
                var prm = $.makeArray(arguments).slice(1);
                // 加到数组的第一个位置
                prm.unshift(this);

                return method.apply(this, prm);
            } else {
                throw "No this Method:" + options;
            }
        }

        options = options || {};
        return this.each(function () {
            var state = $.data(this, "itemlist");
            if (state) {
                $.extend(state.options, options);
                $.itemlist.methods._create(this);
            } else {
                state = $.data(this, "itemlist", {
                    options: $.extend(true, {}, $.itemlist.defaults, options)
                });
                $.itemlist.methods._create(this);
            }
        });
    };

    $.itemlist.defaults = $.itemlist.defaults || {
        template:
        "<div class='sj-item' item-key='<%= key%>' >" +
        "   <%= value%><span class='sj-item-delete' item-key='<%= key%>'></span>" +
        "   " +
        "</div>" +
        "<div class='sj-item-cursor' contenteditable='true' item-key='<%= key%>'></div>",
        dataList: [],
        disabled: false,
        keyName: "key",
        valueNames: ["value"],
        callBack: {
            afterDelete: $.noop,
            afterAdd: $.noop
        }
    };

    $.itemlist.methods = {
        _create: function (target) {
            $(target).each(function () {
                var $t = $(this),
                    options = $t.itemlist("options"),
                    dataList = options.dataList,

                    itemlistHTML = "";

                // 初始化显示内容
                dataList = options.dataList = pickoutItem(dataList);
                $.each(dataList, function (index, item) {
                    itemlistHTML += _.template(options.template, {key: item[options.keyName], value: $t.itemlist("getValueText", item)});
                });
                $t.empty().html("<div class='sj-item-con'>" + itemlistHTML + "</div>");
                $t.attr("title", $t.itemlist("getValueText"));

                // 绑定事件
                $.itemlist.methods._bindEvent(target);
                // 设置可用性
                $t.itemlist("disabled", options.disabled);
            });
        },

        // 绑定事件
        _bindEvent: function (target) {
            var $t = $(target);

            // 绑定事件
            $t
                // 删除
                .off("delete.itemlist")
                .on("delete.itemlist", function (e, itemKey) {
                    $t.itemlist("deleteItemWithNavAndCallBack", itemKey, e);
                })

                // 增加
                .off("add.itemlist")
                .on("add.itemlist", function (e, items) {
                    $t.itemlist("addItemWithNavAndCallBack", items, null, e);
                })

                // 定位
                .off("nav.itemlist")
                .on("nav.itemlist", function (e, itemKey) {
                    $t.itemlist("navItem", itemKey);
                })

                // 左键
                .off("left.itemlist")
                .on("left.itemlist", function (e, itemKey) {
                    $t.trigger("nav.itemlist", $t.itemlist("findPrevItemKey", itemKey));
                })

                // 右键
                .off("right.itemlist")
                .on("right.itemlist", function (e, itemKey) {
                    $t.trigger("nav.itemlist", $t.itemlist("findNextItemKey", itemKey));
                })

                // 删除按钮点击删除
                .off("click", ".sj-item-delete")
                .on("click", ".sj-item-delete", function () {
                    var itemKey = $(this).attr("item-key");

                    $t.trigger("delete.itemlist", itemKey);
                })

                // 定位
                .off("click", ".sj-item")
                .on("click", ".sj-item", function () {
                    var itemKey = $(this).attr("item-key");

                    $t.trigger("nav.itemlist", itemKey);
                })

                // 光标定位
                .off("keydown", ".sj-item-cursor")
                .on("keydown", ".sj-item-cursor", function (event) {
                    var itemKey = $(this).attr("item-key");
                    // BACKSPACE 8
                    if (event.keyCode === 8) {
                        $t.trigger("delete.itemlist", itemKey);
                    }
                    // DELETE 46
                    else if (event.keyCode === 46) {
                        var nextItemKey = $(".sj-item-cursor[item-key=" + itemKey +"]", $t).next().attr("item-key");
                        $t.trigger("delete.itemlist", nextItemKey);
                    }
                    // LEFT 37
                    else if (event.keyCode === 37) {
                        $t.trigger("left.itemlist", itemKey);
                    }
                    // RIGHT 39
                    else if (event.keyCode === 39) {
                        $t.trigger("right.itemlist", itemKey);
                    }
                    else if (event.keyCode === 9) {

                    }
                    else {
                        return false;
                    }
                });
        },
        /**
         * 移动到给定itemKey的元素上（聚焦）
         * @param target
         * @param itemKey
         */
        navItem: function (target, itemKey) {
            var $t = $(target),
                options = $t.itemlist("options"),
                dataList = options.dataList,
                cursorKey,
                $cursor,
                $item, posLeft, posRight;

            if (dataList == null || dataList.length === 0) {
                return;
            }

            cursorKey = itemKey == null ?  _.first(dataList)[options.keyName] : itemKey;
            $cursor = $(".sj-item-cursor[item-key=" + cursorKey +"]", $t);
            $item = $(".sj-item[item-key=" + cursorKey +"]", $t);

            // 聚焦
            placeCaretAtEnd($cursor[0]);

            // 当不能显示完当前项的内容时
            posLeft = $item.position().left;
            if (posLeft < 0) {
                $t.scrollLeft(posLeft);
            }

            // 当不足显示光标时
            posRight = $item.position().left + $item.outerWidth() + $cursor.outerWidth();
            if (posLeft + $t.outerWidth() < posRight) {
                $t.scrollLeft(posRight - ( $t.outerWidth() - 3));
            }
        },

        options: function (target) {
            return $.data(target[0], 'itemlist').options;
        },

        findPrevItemKey: function (target, itemKey) {
            return $(".sj-item[item-key=" + itemKey +"]", $(target)[0]).prev().attr("item-key");
        },

        findNextItemKey: function (target, itemKey) {
            return $(".sj-item-cursor[item-key=" + itemKey +"]", $(target)[0]).next().attr("item-key");
        },

        /**
         * 增加一项（不聚焦也不调用回调函数）
         * @param target
         * @param items
         * @param index
         */
        addItem: function (target, items, index) {
            $(target).each(function () {
                var $t = $(this),
                    options = $t.itemlist("options"),
                    dataList = options.dataList,
                    maxLength,
                    startIndex,

                    addItemlistHTML = "",
                    addItems;


                maxLength = (dataList == null) ? 0 : dataList.length;
                startIndex = index == null
                    ? maxLength
                    : (+index > maxLength)
                    ? maxLength
                    : index;

                addItems = pickoutItem(items);
                $.each(addItems, function (index, item) {
                    addItemlistHTML += _.template(options.template, {key: item[options.keyName], value: $t.itemlist("getValueText", item)});
                });

                if (maxLength > 0) {
                    $(".sj-item-cursor:eq(" + (startIndex - 1) + ")", $t).after($(addItemlistHTML));
                } else {
                    $t.find(".sj-item-con").append($(addItemlistHTML));
                }

                dataList.splice.apply(dataList, [startIndex, 0].concat(addItems));
                $t.attr("title", $t.itemlist("getValueText"));
            });
        },

        /**
         * 删除一项（不聚焦也不调用回调函数）
         * @param target
         * @param keys
         */
        deleteItem: function (target, keys) {
            $(target).each(function () {
                var $t = $(this),
                    options = $t.itemlist("options"),
                    dataList = options.dataList,
                    partList,
                    removeList,
                    deleteKeys;

                // 将要删除的与数据与不用删除的数据分组
                deleteKeys = $.isArray(keys) ? keys : [keys];
                partList = _.partition(dataList, function (item) {
                    return _.contains(deleteKeys, item[options.keyName]);
                });

                // 要保留的数据
                $t.itemlist("options").dataList = partList[1];
                // 要删除的数据
                removeList = partList[0];
                // 删除节点
                $.each(removeList, function (index, item) {
                    $(".sj-item[item-key=" + item[options.keyName] + "]", $t).remove();
                    $(".sj-item-cursor[item-key=" + item[options.keyName] + "]", $t).remove();
                });
                $t.attr("title", $t.itemlist("getValueText"));
            });
        },

        /**
         * 删除所有项目
         * @param target
         */
        deleteAllItem: function (target) {
            $(target).each(function () {
                var $t = $(this),
                    options = $t.itemlist("options"),
                    dataList = pickoutItem(options.dataList),
                    allKeys;

                if (dataList.length === 0) {
                    return;
                }

                allKeys = _.map(dataList, function (item) {
                    return item[options.keyName];
                });

                $t.itemlist("deleteItem", allKeys);
            });
        },

        /**
         * 增加一项（聚焦且调用回调函数）
         * @param target
         * @param items
         * @param index
         * @param event
         */
        addItemWithNavAndCallBack: function (target, items, index, event) {
            var $t = $(target),
                options = $t.itemlist("options");


            items = pickoutItem(items);
            if (items == null || items.length === 0) {
                return;
            }

            $t.itemlist("addItem", items, index);
            $t.itemlist("navItem", $.isArray(items) ? items[0][options.keyName] : items[options.keyName]);
            // 回调
            options.callBack && options.callBack.afterAdd.apply(this, [event, items]);
        },

        /**
         * 删除一项（聚焦且调用回调函数）
         * @param target
         * @param keys
         * @param index
         */
        deleteItemWithNavAndCallBack: function (target, keys, event) {
            var $t = $(target),
                options = $t.itemlist("options"),
                prevItemKey, nextItemKey, focusItemKey;

            if (keys == null || ($.isArray(keys) && keys.length == 0)) {
                return;
            }

            //
            focusItemKey = $.isArray(keys) ? keys[0] : keys;
            prevItemKey = $t.itemlist("findPrevItemKey", focusItemKey);
            nextItemKey = $t.itemlist("findNextItemKey", focusItemKey);

            // 删除元素
            $t.itemlist("deleteItem", keys);

            // 聚焦到删除元素后要聚焦的元素
            if (prevItemKey) {
                $t.itemlist("navItem", prevItemKey);
            } else if (nextItemKey){
                $t.itemlist("navItem", nextItemKey);
            }

            // 回调
            options.callBack && options.callBack.afterDelete.apply(this, [event, keys]);
        },

        /**
         * 将控件置为是否可用
         * @param target
         * @param disabled 是否可用
         */
        disabled: function (target, disabled) {
            var $t = $(target),
                options = $t.itemlist("options");

            if (!disabled) {
                $.itemlist.methods._bindEvent(target);
                $(".sj-item-delete", $t).removeClass("sj-item-disabled");
            } else {
                $t.off("delete.itemlist add.itemlist");
                $(".sj-item-delete", $t).addClass("sj-item-disabled");
            }
            options.disabled = disabled;
        },

        /**
         * 摧毁控件
         * @param target
         */
        destroy: function (target) {
            var $t = $(target);

            $t.off().removeData("itemlist").empty();
        },

        getValueText: function (target, items) {
            var $t = $(target),
                options = $t.itemlist("options"),
                dataList = options.dataList,
                retItems, ret = "",

                joinFields = function (item, fields) {
                    return _.toArray(_.pick(item, fields)).join(" ");
                };

            retItems = items == null
                ? dataList
                : $.isArray(items)
                ? items
                : [items];

            ret = _.reduce(retItems, function (text, item) {
                var itemText = "";

                if (item == null){
                    itemText= "";
                } else if ($.trim(text) === "") {
                    itemText = joinFields(item, options.valueNames);
                } else {
                    itemText =  ";" + joinFields(item, options.valueNames);
                }

                return text + itemText;
            }, ret);

            return $.trim(ret);
        }
    };
})(jQuery);

/**
 * 树控件
 */
(function ($) {
    $.sj = $.sj || {};

    var pickoutNotNull = function (items) {
            if (items == null || ($.isArray(items) && items.length === 0)) {
                return [];
            }
            var itemArray = $.isArray(items) ? items : [items];
            return _.reject(itemArray, function (item) {
                return item == null;
            });
        },

        result = function (array, multiple) {
            return array.length === 0
                ? null
                : multiple === true
                ? array
                : array[0];
        },

    //设置值
        setValues = function (target, sltNodes, props) {
            var $target = $(target),
                ignoreFields = [
                    "check_Child_State", "check_Focus", "checked", "checkedOld", "chkDisabled", "getCheckStatus",
                    "getNextNode", "getParentNode", "getPreNode", "halfCheck", "nocheck", "open", "zAsync", "tId",
                    "isAjaxing", "isFirstNode", "isLastNode","parentTId", "children", "isHover", "editNameFlag", "isParent"
                ],
                hiddenTemplate = "<input name='<%= valueName%>' type='hidden' class='sj-valuefield' value='<%= value%>' /> ",
                $frag = $(document.createDocumentFragment()),
                sltNode, $screen;

            sltNodes = pickoutNotNull(sltNodes);
            // 将不必要的字段删除
            sltNodes = _.map(sltNodes, function (value, index) {
                return _.omit(value, ignoreFields);
            });

            // 1.将数据绑定到控件上
            $target.data("selectedData", result(sltNodes, props.multiple));

            // 2.将之前保存的值的dom元素删除
            $target.nextAll(".sj-valuefield").remove();

            // 3.设置得元素的值
            if (sltNodes.length > 0) {
                for (var i in sltNodes) {
                    sltNode = sltNodes[i];
                    $frag.append(_.template(hiddenTemplate, {
                        valueName: $target.attr("valueName"),
                        value: sltNode[props.keyField]
                    }));
                }
            }
            $frag.insertAfter($target);

            // 4.设置显示的文本
            $screen = $target.prev(".sj-screen-container");
            $screen.itemlist("deleteAllItem");
            $screen.itemlist("addItemWithNavAndCallBack", sltNodes);
            $target.val($screen.itemlist("getValueText"));
        },

    // 获取选择的值
        getValues = function (selectedData, multiple, keyField) {
            var values = _.map(pickoutNotNull(selectedData), function (value, key, list) {
                return value[keyField];
            });

            return result(values, multiple);
        },

    // 初始化树组件
        openDialog = function (props) {
            if (props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
                dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                id: "treeDialog",
                title: "选择",
                width: 380,
                height: 436,
                content: "url:" + props.treeUrl,
                parent: winParent,
                ok: function () {
                    var treeObj = this.content.$.fn.zTree.getZTreeObj("tree"),
                        sltNodeList = treeObj.getSelectedNodes(),
                        $target = $(props.target),
                        sltNode;

                    if (!props.multiple) {
                        sltNode = sltNodeList[0];
                        if (sltNode != null && sltNode.isParent && props.selectLeaf === true) {
                            this.content.tips({type: 2, content: "只能选择叶子节点！"});
                            return false;
                        }

                        // 1.将数据绑定到comboTable控件上
                        $(props.target).data("selectedData", sltNode);
                        setValues($target, sltNode, props);
                    } else {
                        var selectedNodes = treeObj.getCheckedNodes(true),
                        // 选择的所有子节点
                            selectedChildNodes = _.filter(selectedNodes, function (selectNode) {
                                return !selectNode.isParent;
                            });

                        setValues($target, selectedChildNodes, props);
                    }
                    props.afterSelect($target.sjComboTree("getSelectedData"), $target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj.comboTree = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.comboTree.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else if (!method && !$.StringUtils.startsWith(options, "_")) {
                return this.sjWrapBtn(options, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "comboTree");
            if (state) {
                $.extend(state.options, options);
                $.sj.comboTree.methods._create(this);
            } else {
                state = $.data(this, "comboTree", {
                    options: $.extend({}, $.sj.comboTree.defaults, $.sj.comboTree.parseOptions(this), options)
                });
                $.sj.comboTree.methods._create(this);
            }
        });
    };

    $.sj.comboTree.methods = {
        _create: function (target) {
            var $target = $(target), wrapBtn,
                opts = $.data(target, "comboTree").options;

            // 1.包裹上按钮
            wrapBtn = $target.sjWrapBtn(opts);

            if (!$target.attr("valueName")) {
                var $screen;

                $target
                    .attr("componentType", "comboTree")
                    .attr("valueName", $target.attr("name"))
                    .attr("readonly", true)
                    .hide()
                    .addClass("sj-printfield")
                    .removeAttr("name")
                    .removeClass("sj-valuefield");

                wrapBtn.main.width($target.width() + 15);

                $target.before("<div class='sj-screen-container'></div>");
                $screen = $target.prev(".sj-screen-container");
                $screen.width($target.width() - 18);
                $screen.itemlist({
                    keyName: opts.keyField,
                    valueNames: opts.text,
                    callBack: {
                        afterDelete: function (e, itemKey) {
                            $target.sjComboTree("deleteByKey", itemKey);
                        }
                    }
                });
            }

            $target.sjComboTree("disabled", opts.disabled);

            // 2.给"增加"按钮初始化事件
            wrapBtn.btn.off("click.ref").on("click.ref", function () {
                var opts = $target.sjComboTree("options"),
                    treeUrl = opts.treeUrl;

                treeUrl += (treeUrl.indexOf("?") > 0 ? "&" : "?") + "corpId=" + opts.corpId + "&businessType=" + opts.businessType;
                openDialog($.extend(true, {}, opts, {
                    treeUrl: treeUrl,
                    target: $target
                }));
            });

            // 3.给"删除"按钮初始化事件
            wrapBtn.del.off("click.ref").on("click.ref", function () {
                $target.sjComboTree("deleteAll");
            });
        },
        setValues: function (jq, values) {
            return jq.each(function () {
                var opts = $(this).sjComboTree('options');

                setValues(this, values, opts);
            });
        },
        setValue: function (jq, value) {
            return jq.each(function () {
                var opts = $(this).sjComboTree('options');

                setValues(this, value, opts);
            });
        },
        getValues: function (jq) {
            var opts = $(jq[0]).sjComboTree('options'),
                values = $.data(jq[0], 'selectedData');
            return getValues(values, opts.multiple, opts.keyField);
        },
        getValue: function (jq) {
            var opts = $(jq[0]).sjComboTree('options'),
                values = $.data(jq[0], 'selectedData');
            return getValues(values, opts.multiple, opts.keyField);
        },
        options: function (jq) {
            return $.data(jq[0], 'comboTree').options;
        },
        getSelectedData: function (jq) {
            var $target = $(jq[0]),
                multiple = $target.sjComboTree('options').multiple,
                selectedData = pickoutNotNull($target.data('selectedData'));

            return result(selectedData, multiple);
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $($(jq[0]).sjWrapBtn().btn).trigger("click.ref");
        },

        deleteByKey: function (jq, keys) {
            $(jq).each(function () {
                var $target = $(this),
                    opts = $target.sjComboTree('options'),
                    selectedData = $target.sjComboTree("getSelectedData");

                keys = $.isArray(keys) ? keys : [keys];
                selectedData = pickoutNotNull(selectedData);

                if (selectedData.length === 0) {
                    return;
                }

                // 1.删除隐藏域中keys的值
                $.each(keys, function (index, key) {
                    $target.nextAll(".sj-valuefield[value=" + key + "]").remove();
                });

                // 2.获得要保留下来的数据
                selectedData = _.reject(selectedData, function (selectNode) {
                    return _.contains(keys, selectNode[opts.keyField]);
                });

                // 3.重新设置选择的数据
                $target.data("selectedData", result(selectedData, opts.multiple));
            });
        },

        /** 删除所有数据 */
        deleteAll: function (jq) {
            $(jq).each(function () {
                $(this).sjComboTree("setValues", []);
            });
        },

        disabled: function (jq, disabled) {
            $(jq).each(function () {
                var $target = $(this);

                $target.sjWrapBtn("disabled", disabled);
                $target.prev(".sj-screen-container").itemlist("disabled", disabled);
            });
        }
    };

    $.sj.comboTree.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "treeUrl",
            "keyField", "text", "multiple", "openConditon", "disabled"
        ]));
    };

    $.sj.comboTree.defaults = {
        corpId: "",
        businessType: "AREA_TYPE", //required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,

        // matchValue: "",
        afterSelect: function (selectedValue) {
        },

        //treeUrl: "http://" + window.location.host + App["contextPath"] + "/bd/refTree.htm?token=" + userInfoUtil.getToken(),
        treeUrl: "http://" + window.location.host + App["contextPath"] + "/bd/refTree.htm",

        /** 返回给后台的字段 */
        keyField: "id",
        /** 展示的字段, 备注: 可以为数组或函数 */
        text: ["name"], //
        multiple: true,
        selectLeaf: true,
        /**  当返回false时不打开窗口 */
        openConditon: function () {
            return true;
        }
    };

    $.fn.sjComboTree = $.sj.comboTree;
})(jQuery);

/**
 * "全部"与"已选"控件
 *
 * 保持如下结构
 *  <div class="sj-table-tab">
 *      <div title="全部" style="padding:10px">
 *          <table class="sj-first-tab"></table>
 *          <div class="gridpaper"></div>
 *      </div>
 *      <div title="已选" style="padding:10px">
 *          <table class="sj-second-tab"></table>
 *      </div>
 *  </div>
 *
 * Dependencies:easyUI, jqGrid
 *
 * 使用方法如下
 * 1.初始化控件时传对象$(jq).sjTableTab({...})
 * 2.调用方法时$(jq).sjTableTab("方法名"，"参数1","参数2",...)
 * 3.$.sj.tableTab.methods下非"_"开头的都可调用
 *
 * e.g.
 * 1.初如化控件使用如下
 *      $(".sj-table-tab").sjTableTab({
 *          colModelUrl:tableUrl,
 *          dataUrl: dataUrl
 *      });
 * 2.调用方法如下
 *      $(".sj-table-tab").sjTableTab("getSelectedData")
 *
 */
(function ($) {
    $.sj = $.sj || {};
    $.sj.tableTab = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.tableTab.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "tableTab");
            if (state) {
                $.extend(state.options, options);
                $.sj.tableTab.methods._create(this);
            } else {
                state = $.data(this, "tableTab", {
                    options: $.extend({}, $.sj.tableTab.defaults, $.sj.tableTab.parseOptions(this), options),
                    data: []
                });
                $.sj.tableTab.methods._create(this);
            }
        });
    };

    var getColModelByTableInfo = function (tableInfo) {
        var sortTableInfo = _.sortBy(tableInfo.columnInfoVos, 'index'),
            colModel;

        colModel = _.map(sortTableInfo, function (value, key, list) {
            var result = {
                name: value.fieldName,
                label: value.fieldTitle,
                key: tableInfo.idField == value.fieldName,
                hidden: _.contains(tableInfo.hideFields, value.fieldName),
                index: value.fieldName
            };
            if (value.widthScale) {
                result.width = value.widthScale;
            }
            if ($.StringUtils.startsWith(value.fieldName, "is")) {
                result.formatter = "checkbox";
                result.editoptions = {value: "true:false"};
                result.align = "center";
            } else if ($.StringUtils.endsWith(value.fieldName, "Date")) {
                result.formatter = "sjDate";
            }
            return result;
        });

        return colModel;
    };

    $.sj.tableTab.methods = {

        /**
         * 创建组件
         * @param target 要生成tableTab的jQuery表达式、jQuery对象或者dom元素
         * @private
         */
        _create: function (target) {
            var $target = $(target),
                opts = $.data(target, "tableTab").options;

            $(target).addClass("sj-table-tab");

            // 1.校验必须的选项
            //================
            if (!opts.colModelUrl || $.trim(opts.colModelUrl) === "") {
                throw "need colModelUrl to init the tableTab component";
            }
            if (!opts.dataUrl || $.trim(opts.dataUrl) === "") {
                throw "need dataUrl to init the tabTab component";
            }

            if ($(".sj-first-tab", target).length === 0 || $(".sj-second-tab", target).length === 0) {
                throw "cann't find 'sj-first-tab class' or 'sj-second-tab' element";
            }
            //================

            // 2.根据colModelUrl获取表格baseColMode
            $.ajax({
                url: opts.colModelUrl,
                data: JSON.stringify(opts.colModelUrlPostData),
                dataType: "json",
                method:"POST",
                contentType: "application/json",
                async: true,
                success: function (tableInfo) {
                    if ($.isPlainObject(tableInfo) && tableInfo.success != null && !tableInfo.success) {
                        tips({type: Tips.TYPE.WARN, content: tableInfo.message});
                        return;
                    }

                    var baseColModel = getColModelByTableInfo(tableInfo),
                        $grid1 = $(".sj-first-tab", target).first(),
                        $grid2 = $(".sj-second-tab", target).first();

                    $.data(target, "baseColModel", baseColModel);
                    opts.tableIdField = tableInfo["idField"];

                    // 3.tab初始化
                    $target.data("needReload", true);
                    $target.eyTabs({
                        selected: 0,
                        onSelect: function (title, index) {
                            if (index == 1) {
                                if ($target.data("needReload")) {
                                    var entryList = _.values($target.data("selectedData") || {});
                                    $target.data("needReload", false);
                                    $grid2.jqGrid("clearGridData");
                                    if (entryList != null && entryList.length > 0) {
                                        for (var i = 0, length = entryList.length; i < length; i++) {
                                            var row = entryList[i];
                                            $grid2.jqGrid("addRowData", row[tableInfo.idField], row);
                                        }
                                    }
                                }
                            } else if (index == 0) {
                                if ($target.data("needReSelect")) {
                                    $.sj.tableTab.methods._reselectForCurPage($target);
                                    $target.data("needReSelect", false);
                                }
                            }
                        }
                    });

                    // 4.初始化firstGrid
                    var $lastHiddenParent = null;
                    if ($grid1.is(":hidden")) {
                    	$lastHiddenParent = $grid1.parentsUntil(":visible").last();
                    	$lastHiddenParent.show();
                    }
                    var firstTabWidth = $target.eyTabs("getTab", 0).outerWidth(),
                        firstGridLeft = $grid1.position().left + 15;

                    if ($lastHiddenParent != null) {
                    	$lastHiddenParent.hide();
                    }

                    $grid1.jqGrid(
                        $.extend({}, $.sj.tableTab.firstGridParam(opts.tableIdField, opts.fristGridParam), {
                            width: firstTabWidth - firstGridLeft,
                            url: opts.dataUrl,
                            postData: opts.dataUrlPostData,
                            colModel: baseColModel,
                            multiselect: opts.multiple,
                            pager: opts.firstGridParam.pager ? opts.firstGridParam.pager : jQuery(".sj-firstgrid-paper", target).first()
                        }));

                    // 5.初始化secondGrid
                    var grid2ColModel = baseColModel.slice(0),
                        secondTabWidth = $target.eyTabs("select", 0).outerWidth(),
                        secondGridLeft = $grid2.offset().left;

                    grid2ColModel.splice(0, 0, {name: "operate", label: " 操作", width: 4, align: "center", formatter: "sjOperate", formatoptions: {types: ["minus"]}});
                    $grid2.jqGrid(
                        $.extend({}, $.sj.tableTab.secondGridParam(opts.tableIdField), {
                            width: secondTabWidth - secondGridLeft - 25,
                            colModel: grid2ColModel,
                            rowList: [],//不显示跨页选择框
                            pager: jQuery("#secondGridpaper", target)
                        })
                    );
                    $target.eyTabs("select", 0);//默认打开第1个页面
                }
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'tableTab').options;
        },
        getSelectedData: function (jq) {
            return $.data(jq[0], 'selectedData');
        },
        getFirstGrid: function (jq) {
            return $(".sj-first-tab", jq);
        },
        getSecondGrid: function (jq) {
            return $(".sj-second-tab", jq);
        },
        getBaseColModel: function (jq) {
            return $.data(jq[0], 'tableTab').baseColModel;
        },

        /**
         * 删除secondTab中的一行数据
         * @param jq class="sj-table-tab"的jquery对象
         * @param rowId 行id
         */
        delRow: function (jq, rowId) {
            var $tableTab = $(jq),
                opts = $tableTab.sjTableTab("options"),
                $grid2 = $tableTab.sjTableTab("getSecondGrid"),
                selectedData = $(jq).sjTableTab("getSelectedData");

            if (selectedData[rowId]) {
                delete selectedData[rowId];
                $grid2.jqGrid("delRowData", rowId);
                $tableTab.data("needReSelect", true);
                $tableTab.data("needReload", true);
            }
        },

        /**
         * 将当前已选择的数据置为选择状态
         * @param jq class="sj-table-tab"的jquery对象
         */
        _reselectForCurPage: function (jq) {
            var $tableTab = $(jq),
                selectedData = $tableTab.data("selectedData"),
                pageData = $tableTab.data("pageData"),
                $grid1 = $tableTab.sjTableTab("getFirstGrid"),
                idField = $tableTab.sjTableTab("options").tableIdField,
                keys, selIds, curPageSel;

            //当前页的所有id
            keys = $grid1.jqGrid("getCol", idField);
            $grid1.jqGrid("resetSelectionRow");
            //已选择的所有id
            if (selectedData) {
                selIds = _.keys(selectedData);
                //当前页选择的id
                curPageSel = _.intersection(selIds, keys);

                _.each(curPageSel, function (key) {
                    $grid1.jqGrid("setSelectionRow", key);
                });
            }
        },

        selectForFirstTab: function (jq, selectData) {
            if (!selectData) {
                return;
            }
            var sltData = {},
                key = $(jq).sjTableTab("options").tableIdField;

            selectData = $.isArray(selectData) ? selectData : [selectData];

            $.each(selectData, function (index, data) {
                sltData[data[key]] = data;
            });
            jq.data("selectedData", sltData);
            try {
                $.sj.tableTab.methods._reselectForCurPage(jq);
            } catch (e) {
            }
            jq.data("needReload", true);
        }
    };

    $.sj.tableTab.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, {}, $.parser.parseOptions(target, [
            'colModelUrl', 'dataUrl'
        ]));
    };

    /**
     * 第1个表格默认gridParam属性
     */
    $.sj.tableTab.firstGridParam = function (key, gridParam) {
        var selectRow = function (grid, aRowids, status, needReload) {
                var $grid1 = $(grid),
                    $tableTab = $grid1.closest(".sj-table-tab"),
                    pageData = $tableTab.data("pageData"),
                    selectedData = $tableTab.data("selectedData") || {};

                $.each(aRowids, function (index, rowId) {
                    $tableTab.data("needReload", needReload);
                    if (status) {
                        if(!$tableTab.sjTableTab("options").multiple) {
                            selectedData = {};
                        }
                        selectedData[rowId] = _.find(pageData, function (row) {
                            return row[key] == rowId;
                        });
                    } else {
                        delete selectedData[rowId];
                    }

                });
                $tableTab.data("selectedData", selectedData);
            },
            param = {
                rownumbers: true, //展示行号
                multiselect: true,//能多选
                height: 258,
                onSelectRow: function (rowId, status, e) {
                    //调用setSelectionRow这个方法不会存在e这个event对象
                    //手工勾选checkbox时则会存在e这个event对象
                    selectRow($(this), [rowId], status, (e || $(this).closest(".sj-table-tab").data("needReload")) ? true : false);
                },
                onSelectAll: function (aRowids, status) {
                    selectRow($(this), aRowids, status, aRowids && aRowids.length > 0 ? true : false);
                },
                ajaxGridOptions: { contentType: "application/json" },
                serializeGridData: function (postData) {
                    var postObj = $.extend(true, {}, postData);
                    postObj.pageInfo = {
                        currentPage: postData.page,
                        pageSize: postData.rows
                    };
                    delete postObj.page;
                    delete postObj.rows;
                    return JSON.stringify(postObj);
                },
                ondblClickRow: function (aRowid) {
                    var $grid1 = $(this),
                        $tableTab = $grid1.closest(".sj-table-tab");

                    // 单选时双击选择数据并关掉对话框
                   // if(!$tableTab.sjTableTab("options").multiple) {
                        selectRow($(this), [aRowid], true, true);
                        // 点击对话框的确定按钮
                        frameElement.api && frameElement.api._click("ok");
                    //}
                },
                loadComplete: function (data) {
                    var $tableTab = $(this).closest(".sj-table-tab");

                    $tableTab.data("pageData", data.rows);
                    $.sj.tableTab.methods._reselectForCurPage($tableTab);
                },
                jsonReader: {
                    id: key || "id"
                }
            };

            $.extend(param, gridParam);
        return param;
    };

    /**
     * 第2个表格默认gridParam属性
     */
    $.sj.tableTab.secondGridParam = function (key) {
        return {
            rownumbers: true, //展示行号
            pgbuttons: false,//不显示翻页按钮
            pginput: false,//不显示页数输入按钮
            rowList: [],//不显示跨页选择框
            rowNum: -1,
            datatype: "clientSide",
            height: 258,
            jsonReader: {
                id: key || "id"
            }
        };
    };

    $.fn.sjTableTab = $.sj.tableTab;
    $.sj.tableTab.defaults = {
        colModelUrl: "",
        colModelUrlPostData: {},
        dataUrl: "",
        dataUrlPostData: {},
        multiple: true,
        tableIdField: "id",
        firstGridParam: {}
    };
})(jQuery);

/**
 * 表控件
 * Dependencies: EasyUI, jqGrid,sjWrapBtn
 */
(function ($) {
    var pickoutNotNull = function (items) {
            if (items == null || ($.isArray(items) && items.length === 0)) {
                return [];
            }
            var itemArray = $.isArray(items) ? items : [items];
            return _.reject(itemArray, function (item) {
                return item == null;
            });
        },

        result = function (array, multiple) {
            return array.length === 0
                ? null
                : multiple === true
                ? array
                : array[0];
        },

    //设置值
        setValues = function (target, sltNodes, props) {
            var $target = $(target),
                $frag = $(document.createDocumentFragment()),
                hiddenTemplate = "<input name='<%= valueName%>' type='hidden' class='sj-valuefield' value='<%= value%>' /> ",
                sltNode, $screen;

            sltNodes = pickoutNotNull(sltNodes);

            // 1.将数据绑定到控件上
            $target.data("selectedData", result(sltNodes, props.multiple));

            // 2.将之前保存的值的dom元素删除
            $target.nextAll(".sj-valuefield").remove();

            // 3.设置得元素的值
            if (sltNodes.length > 0) {
                for (var i in sltNodes) {
                    sltNode = sltNodes[i];
                    $frag.append(_.template(hiddenTemplate, {valueName: $target.attr("valueName"), value: sltNode[props.keyField]}));
                }
            }
            $frag.insertAfter($target);

            // 4.设置显示的文本
            $screen = $target.prev(".sj-screen-container");
            $screen.itemlist("deleteAllItem");
            $screen.itemlist("addItemWithNavAndCallBack", sltNodes);
            $target.val($screen.itemlist("getValueText"));
        },

    // 获取选择的值
        getValues = function (selectedData, multiple, keyField) {
            var values = _.map(pickoutNotNull(selectedData), function (value, key, list) {
                return value[keyField];
            });

            return result(values, multiple);
        },

        openDialog = function (props) {
            if(props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
                dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                id: "tableDialog",
                title: "选择",
                width: 780,
                height: 412,
                content: "url:" + props.tableUrl,
                parent: winParent,
                focus: true,
                data: $.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}),
                ok: function () {
                    var jq = this.content.$,
                        selData = jq(".sj-table-tab").sjTableTab("getSelectedData"),
                        selectedData = _.values(selData);

                    if (selectedData && selectedData.length > 1 && !props.multiple) {
                        this.content.tips({type: 2, content: "只能选择一个哟！"});
                        return false;
                    }
                    setValues(props.target, selectedData, props);
                    props.afterSelect(props.target.sjComboTable("getSelectedData"), props.target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj = $.sj || {};

    $.sj.comboTable = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.comboTable.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else if(!method && !$.StringUtils.startsWith(options, "_")) {
                return this.sjWrapBtn(options, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "comboTable");
            if (state) {
                $.extend(state.options, options);
                $.sj.comboTable.methods._create(this);
            } else {
                state = $.data(this, "comboTable", {
                    options: $.extend({}, $.sj.comboTable.defaults, $.sj.comboTable.parseOptions(this), options),
                    data: []
                });
                $.sj.comboTable.methods._create(this);
            }
        });
    };

    $.sj.comboTable.methods = {
        _create: function (target) {
            var $target = $(target),
                opts = $.data(target, "comboTable").options,
                wrapBtn = $target.sjWrapBtn(opts);

            if (!$target.attr("valueName")) {
                var $screen;

                $target
                    .attr("componentType", "comboTable")
                    .attr("valueName", $target.attr("name"))
                    .attr("readonly", true)
                    .hide()
                    .addClass("sj-printfield")
                    .removeAttr("name")
                    .removeClass("sj-valuefield");

                wrapBtn.main.width($target.width() + 13);

                $target.before("<div class='sj-screen-container'></div>");
                $screen = $target.prev(".sj-screen-container");
                $screen.width($target.width() - 18);
                $screen.itemlist({
                    keyName: opts.keyField,
                    valueNames: opts.text,
                    callBack: {
                        afterDelete: function (e, itemKey) {
                            $target.sjComboTable("deleteByKey", itemKey);
                        }
                    }
                });
            }

            $target.sjComboTable("disabled", opts.disabled);

            // 2.给"增加"按钮初始化事件
            wrapBtn.btn.off("click.ref").on("click.ref", function () {
                var opts = $target.sjComboTable("options"),
                    tableUrl = opts.tableUrl;

                openDialog($.extend(true, {}, opts, {
                    tableUrl: tableUrl,
                    target: $target
                }));
            });

            // 3.给"删除"按钮初始化事件
            wrapBtn.del.off("click.ref").on("click.ref", function () {
                $target.sjComboTable("deleteAll");
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'comboTable').options;
        },
        setValues: function (jq, values) {
            return jq.each(function () {
                var opts = $(this).sjComboTable('options');

                setValues(this, values, opts);
            });
        },
        setValue: function (jq, value) {
            return jq.each(function () {
                var opts = $(this).sjComboTable('options');
                setValues(this, value, opts);
            });
        },
        getValues: function (jq) {
            var opts = $(jq[0]).sjComboTable('options'),
                values = $.data(jq[0], 'selectedData');

            return getValues(values, opts.multiple, opts.keyField);
        },
        getValue: function (jq) {
            var opts = $(jq[0]).sjComboTable('options'),
                values = $.data(jq[0], 'selectedData');

            return getValues(values, opts.multiple, opts.keyField);
        },
        getSelectedData: function (jq) {
            var $target = $(jq[0]),
                multiple = $target.sjComboTable('options').multiple,
                selectedData = pickoutNotNull($target.data('selectedData'));

            return result(selectedData, multiple);
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $($(jq[0]).sjWrapBtn().btn).trigger("click.ref");
        },
        deleteByKey: function (jq, keys) {
            $(jq).each(function () {
                var $target = $(this),
                    opts = $target.sjComboTable('options'),
                    selectedData = $target.sjComboTable("getSelectedData");

                keys = $.isArray(keys) ? keys : [keys];
                selectedData = pickoutNotNull(selectedData);

                if (selectedData.length === 0) {
                    return;
                }

                // 1.删除隐藏域中keys的值
                $.each(keys, function (index, key) {
                    $target.nextAll(".sj-valuefield[value=" + key + "]").remove();
                });

                // 2.获得要保留下来的数据
                selectedData = _.reject(selectedData, function (selectNode) {
                    return _.contains(keys, selectNode[opts.keyField]);
                });

                // 3.重新设置选择的数据
                $target.data("selectedData", result(selectedData, opts.multiple));
            });
        },
        /** 删除所有数据 */
        deleteAll: function (jq) {
            $(jq).each(function () {
                $(this).sjComboTable("setValues", []);
            });
        },
        disabled: function (jq, disabled) {
            $(jq).each(function () {
                var $target = $(this);

                $target.sjWrapBtn("disabled", disabled);
                $target.prev(".sj-screen-container").itemlist("disabled", disabled);
            });
        }
    };

    $.sj.comboTable.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "tableUrl", "text", "keyField", "multiple", "openConditon", "disabled"
        ]));
    };

    $.sj.comboTable.defaults = {
        corpId: "corpId",
        //matchValue: "",
        businessType: "WAREHOUSE",//required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,

        //当关闭对话框时调用
        afterSelect: function (selectedValue) {
        },

        //tableUrl: "http://" + window.location.host + App["contextPath"] + "/bd/refTable.htm?token=" + userInfoUtil.getToken(),
        tableUrl: "http://" + window.location.host + App["contextPath"] + "/bd/refTable.htm",

        /** 返回给后台的字段*/
        keyField: "id",
        /** 展示的字段, 备注： 可为数组或函数 */
        text: ["name"],
        multiple: true,
        /**  当返回false时不打开窗口 */
        openConditon: function () {return true;}
    };

    $.fn.sjComboTable = $.sj.comboTable;
})(jQuery);

/**
 * 树表控件
 */
(function ($) {
    $.sj = $.sj || {};

    var pickoutNotNull = function (items) {
            if (items == null || ($.isArray(items) && items.length === 0)) {
                return [];
            }
            var itemArray = $.isArray(items) ? items : [items];
            return _.reject(itemArray, function (item) {
                return item == null;
            });
        },

        result = function (array, multiple) {
            return array.length === 0
                ? null
                : multiple === true
                ? array
                : array[0];
        },

    //设置值
        setValues = function (target, sltNodes, props) {
            var $target = $(target),
                $frag = $(document.createDocumentFragment()),
                hiddenTemplate = "<input name='<%= valueName%>' type='hidden' class='sj-valuefield' value='<%= value%>' /> ",
                sltNode, $screen;

            sltNodes = pickoutNotNull(sltNodes);

            // 1.将数据绑定到控件上
            $target.data("selectedData", result(sltNodes, props.multiple));

            // 2.将之前保存的值的dom元素删除
            $target.nextAll(".sj-valuefield").remove();

            // 3.设置得元素的值
            if (sltNodes.length > 0) {
                for (var i in sltNodes) {
                    sltNode = sltNodes[i];
                    $frag.append(_.template(hiddenTemplate, {valueName: $target.attr("valueName"), value: sltNode[props.keyField]}));
                }
            }
            $frag.insertAfter($target);

            // 4.设置显示的文本
            $screen = $target.prev(".sj-screen-container");
            $screen.itemlist("deleteAllItem");
            $screen.itemlist("addItemWithNavAndCallBack", sltNodes);
            $target.val($screen.itemlist("getValueText"));
        },

    // 获取选择的值
        getValues = function (selectedData, multiple, keyField) {
            var values = _.map(pickoutNotNull(selectedData), function (value, key, list) {
                return value[keyField];
            });

            return result(values, multiple);
        },

    //初始化树表组件
        openDialog = function (props) {
            if (props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
                dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                id: "treeTableDialog",
                title: "选择",
                content: "url:" + props.treeTableUrl,
                width: 1030,
                height: 412,
                parent: winParent,
                data: $.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}),
                ok: function () {
                    var jq = this.content.$,
                        selData = jq(".sj-table-tab").sjTableTab("getSelectedData"),
                        selectedData = _.values(selData);

                    if (selectedData.length > 1 && !props.multiple) {
                        this.content.tips({type: 2, content: "只能选择一个哟！"});
                        return false;
                    }
                    setValues(props.target, selectedData, props);

                    props.afterSelect(props.target.sjComboTreeTable("getSelectedData"), props.target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj.comboTreeTable = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.comboTreeTable.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else if (!method && !$.StringUtils.startsWith(options, "_")) {
                return this.sjWrapBtn(options, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "comboTreeTable");
            if (state) {
                $.extend(state.options, options);
                $.sj.comboTreeTable.methods._create(this);
            } else {
                state = $.data(this, "comboTreeTable", {
                    options: $.extend({}, $.sj.comboTreeTable.defaults, $.sj.comboTreeTable.parseOptions(this), options)
                });
                $.sj.comboTreeTable.methods._create(this);
            }
        });
    };

    $.sj.comboTreeTable.methods = {
        _create: function (target) {
            var $target = $(target), wrapBtn,
                opts = $.data(target, "comboTreeTable").options;

            // 1.包裹上按钮
            wrapBtn = $target.sjWrapBtn(opts);

            if (!$target.attr("valueName")) {
                var $screen;

                $target
                    .attr("componentType", "comboTreeTable")
                    .attr("valueName", $target.attr("name"))
                    .attr("readonly", true)
                    .hide()
                    .addClass("sj-printfield")
                    .removeAttr("name")
                    .removeClass("sj-valuefield");

                wrapBtn.main.width($target.width() + 13);

                $target.before("<div class='sj-screen-container'></div>");
                $screen = $target.prev(".sj-screen-container");
                $screen.width($target.width() - 18);
                $screen.itemlist({
                    keyName: opts.keyField,
                    valueNames: opts.text,
                    callBack: {
                        afterDelete: function (e, itemKey) {
                            $target.sjComboTreeTable("deleteByKey", itemKey);
                        }
                    }
                });
            }

            $target.sjComboTreeTable("disabled", opts.disabled);

            // 3.给"增加"按钮初始化事件
            wrapBtn.btn.off("click.ref").on("click.ref", function () {
                var opts = $target.sjComboTreeTable("options"),
                    treeTableUrl = opts.treeTableUrl;

                treeTableUrl += (treeTableUrl.indexOf("?") > 0 ? "&" : "?") + "corpId=" + opts.corpId + "&businessType=" + opts.businessType;
                openDialog($.extend(true, {}, opts, {
                    treeTableUrl: treeTableUrl,
                    selectLeaf: true,
                    target: $target
                }));
            });

            // 3.给"删除"按钮初始化事件
            wrapBtn.del.off("click.ref").on("click.ref", function () {
                $target.sjComboTreeTable("deleteAll");
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'comboTreeTable').options;
        },
        setValues: function (jq, values) {
            return jq.each(function () {
                var opts = $(this).sjComboTreeTable('options');

                setValues(this, values, opts);
            });
        },
        setValue: function (jq, value) {
            return jq.each(function () {
                var opts = $(this).sjComboTreeTable('options');
                setValues(this, value, opts);
            });
        },
        getValues: function (jq) {
            var opts = $(jq[0]).sjComboTreeTable('options'),
                values = $.data(jq[0], 'selectedData');
            return getValues(values, opts.multiple, opts.keyField);
        },
        getValue: function (jq) {
            var opts = $(jq[0]).sjComboTreeTable('options'),
                values = $.data(jq[0], 'selectedData');
            return getValues(values, opts.multiple, opts.keyField);
        },
        getSelectedData: function (jq) {
            var $target = $(jq[0]),
                multiple = $target.sjComboTreeTable('options').multiple,
                selectedData = pickoutNotNull($target.data('selectedData'));

            return result(selectedData, multiple);
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $($(jq[0]).sjWrapBtn().btn).trigger("click.ref");
        },

        deleteByKey: function (jq, keys) {
            $(jq).each(function () {
                var $target = $(this),
                    opts = $target.sjComboTreeTable('options'),
                    selectedData = $target.sjComboTreeTable("getSelectedData");

                keys = $.isArray(keys) ? keys : [keys];
                selectedData = pickoutNotNull(selectedData);

                if (selectedData.length === 0) {
                    return;
                }

                // 1.删除隐藏域中keys的值
                $.each(keys, function (index, key) {
                    $target.nextAll(".sj-valuefield[value=" + key + "]").remove();
                });

                // 2.获得要保留下来的数据
                selectedData = _.reject(selectedData, function (selectNode) {
                    return _.contains(keys, selectNode[opts.keyField]);
                });

                // 3.重新设置选择的数据
                $target.data("selectedData", result(selectedData, opts.multiple));
            });
        },

        /** 删除所有数据 */
        deleteAll: function (jq) {
            $(jq).each(function () {
                $(this).sjComboTreeTable("setValues", []);
            });
        },

        disabled: function (jq, disabled) {
            $(jq).each(function () {
                var $target = $(this);

                $target.sjWrapBtn("disabled", disabled);
                $target.prev(".sj-screen-container").itemlist("disabled", disabled);
            });
        }
    };

    $.sj.comboTreeTable.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "treeTableUrl",
            "keyField", "text", "multiple", "openConditon", "disabled"
        ]));
    };

    $.sj.comboTreeTable.defaults = {
        corpId: "", //公司编号
        //matchValue: "",
        businessType: "EMPLOYEE",//required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,
        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        treeSqlType: null,
        // 可为json对象或为返回json对象的函数
        treeSqlData: null,

        //当关闭对话框时调用
        afterSelect: function (selectedValue) {
        },

        //treeTableUrl: App.contextPath + "/bd/refTreeTable.htm?token=" + userInfoUtil.getToken(), //required
        //treeTableUrl: "http://" + window.location.host + App.contextPath + "/bd/refTreeTable.htm?token=" + userInfoUtil.getToken(), //required
        treeTableUrl: "http://" + window.location.host + App.contextPath + "/bd/refTreeTable.htm", //required
        /** 返回给后台的字段 */
        keyField: "id",
        /** 展示的字段, 备注： 可为数组或函数 */
        text: ["name"],
        multiple: true,
        openConditon: function () {
            return true;
        }
    };

    $.fn.sjComboTreeTable = $.sj.comboTreeTable;
})(jQuery);


/**
 * 树参照弹出框组件
 */
(function ($) {
    $.sj = $.sj || {};

    var // 初始化树组件
        openDialog = function (props) {
            if (props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
            	dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                title: "选择",
                width: 380,
                height: 430,
                content: "url:" + props.treeUrl,
                parent: winParent,
                ok: function () {
                    var treeObj = this.content.$.fn.zTree.getZTreeObj("tree"),
                        selectedNodes = props.multiple ? treeObj.getCheckedNodes(true) : treeObj.getSelectedNodes(),
                        $target = $(props.target);

                    props.afterSelect(selectedNodes, $target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj.refTreeDialog = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.refTreeDialog.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "refTreeDialog");
            if (state) {
                $.extend(state.options, options);
                $.sj.refTreeDialog.methods._create(this);
            } else {
                state = $.data(this, "refTreeDialog", {
                    options: $.extend({}, $.sj.refTreeDialog.defaults, $.sj.refTreeDialog.parseOptions(this), options)
                });
                $.sj.refTreeDialog.methods._create(this);
            }
        });
    };

    $.sj.refTreeDialog.methods = {
        _create: function (target) {
            var $target = $(target).attr("componentType", "refTreeDialog"),
                opts = $.data(target, "refTreeDialog").options;

            // 3.给按钮初始化事件
            $target.off("click.ref").on("click.ref", function () {
                var opts = $target.sjRefTreeDialog("options"),
                    treeUrl = opts.treeUrl;

                treeUrl += (treeUrl.indexOf("?") > 0 ? "&" : "?") + "corpId=" + opts.corpId + "&businessType=" + opts.businessType;
                openDialog($.extend(true, {}, opts, {
                    treeUrl: treeUrl,
                    target: $target
                }));
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'refTreeDialog').options;
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $(jq[0]).trigger("click.ref");
        }
    };

    $.sj.refTreeDialog.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "treeUrl",
            "keyField", "multiple", "openConditon"
        ]));
    };

    $.sj.refTreeDialog.defaults = {
        corpId: "",
        businessType: "AREA_TYPE", //required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,

        // matchValue: "",
        afterSelect: function (selectedValue) {
            alert(selectedValue);
        },
        //treeUrl: App.contextPath + "/bd/refTree.htm?token=" + userInfoUtil.getToken(),
        treeUrl: App.contextPath + "/bd/refTree.htm",
        /** 返回给后台的字段 */
        keyField: "id",
        multiple: true,

        /**  当返回false时不打开窗口 */
        openConditon: function () {
            return true;
        }
    };

    $.fn.sjRefTreeDialog = $.sj.refTreeDialog;
})(jQuery);

/**
 * 表参照弹出框组件
 */
(function ($) {
    var openDialog = function (props) {
            if(props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
            	dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                title: "选择",
                width: 780,
                height: 412,
                content: "url:" + props.tableUrl,
                parent: winParent,
                data: $.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}),
                ok: function () {
                    var jq = this.content.$,
                        selData = jq(".sj-table-tab").sjTableTab("getSelectedData"),
                        selectedData = _.values(selData);

                    if (selectedData && selectedData.length > 1 && !props.multiple) {
                        this.content.tips({type: 2, content: "只能选择一个哟！"});
                        return false;
                    }
                    props.afterSelect(selectedData, props.target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj = $.sj || {};
    $.sj.refTableDialog = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.refTableDialog.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "refTableDialog");
            if (state) {
                $.extend(state.options, options);
                $.sj.refTableDialog.methods._create(this);
            } else {
                state = $.data(this, "refTableDialog", {
                    options: $.extend({}, $.sj.refTableDialog.defaults, $.sj.refTableDialog.parseOptions(this), options),
                    data: []
                });
                $.sj.refTableDialog.methods._create(this);
            }
        });
    };

    $.sj.refTableDialog.methods = {
        _create: function (target) {
            var $target = $(target).attr("componentType", "refTableDialog");

            // 1.给按钮初始化事件
            $target.off("click.ref").on("click.ref", function () {
                var opts = $target.sjRefTableDialog("options"),
                    tableUrl = opts.tableUrl;

                openDialog($.extend(true, {}, opts, {
                    tableUrl: tableUrl,
                    target: $target
                }));
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'refTableDialog').options;
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $(jq[0]).trigger("click.ref");
        }
    };

    $.sj.refTableDialog.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "tableUrl", "text", "keyField", "multiple"
        ]));
    };

    $.sj.refTableDialog.defaults = {
        corpId: "corpId",
        //matchValue: "",
        businessType: "WAREHOUSE",//required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,

        //当关闭对话框时调用
        afterSelect: function (selectedValue) {
        },

        //tableUrl: "",//required
        //tableUrl: App.contextPath + "/bd/refTable.htm?token=" + userInfoUtil.getToken(),
        tableUrl: App.contextPath + "/bd/refTable.htm",
        /** 返回给后台的字段*/
        keyField: "id",
        /** 展示的字段, 备注： 可为数组或函数 */
        text: ["name"],
        multiple: true,
        /**  当返回false时不打开窗口 */
        openConditon: function () {return true;}
    };

    $.fn.sjRefTableDialog = $.sj.refTableDialog;
})(jQuery);

/** 树表弹出框组件 */
(function ($) {
    $.sj = $.sj || {};

    var openDialog = function (props) {
            if (props.openConditon() === false) {
                return;
            }

            var win = window,
                winParent = window.frameElement && window.frameElement.api,
            	dialog = winParent ? window.frameElement.api.opener.$.dialog : $.dialog;

            dialog({
                title: "选择",
                content: "url:" + props.treeTableUrl,
                width: 1030,
                height: 412,
                parent: winParent,
                data: $.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}),
                ok: function () {
                    var jq = this.content.$,
                        selData = jq(".sj-table-tab").sjTableTab("getSelectedData"),
                        selectedData = _.values(selData);

                    if (selectedData.length > 1 && !props.multiple) {
                        this.content.tips({type: 2, content: "只能选择一个哟！"});
                        return false;
                    }
                    props.afterSelect(selectedData, props.target);
                },
                cancel: function () {
                },
                init: function () {
                    this.content.ready && this.content.ready($.extend(true, {}, props, {selectedData: $(props.target).data("selectedData")}));
                },
                close: function () {
                    // 解决当关闭窗口时，如是找开窗口的页面也是dialog且配置是锁屏时，则再次锁屏，不然会解锁
                    setTimeout(function () {
                        $.each(win.$.dialog.list, function () {
                            if ($.contains(this.DOM.content[0], props.target[0]) && this.config.lock === true) {
                                this.lock();
                                return false;
                            }
                        });
                    }, 0);
                }
            });
        };

    $.sj.refTreeTableDialog = function (options, param) {
        if (typeof options == 'string') {
            var method = $.sj.refTreeTableDialog.methods[options];
            if (method && !$.StringUtils.startsWith(options, "_")) {
                return method(this, param);
            } else {
                throw "No this Method:" + options;
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "refTreeTableDialog");
            if (state) {
                $.extend(state.options, options);
                $.sj.refTreeTableDialog.methods._create(this);
            } else {
                state = $.data(this, "refTreeTableDialog", {
                    options: $.extend({}, $.sj.refTreeTableDialog.defaults, $.sj.refTreeTableDialog.parseOptions(this), options)
                });
                $.sj.refTreeTableDialog.methods._create(this);
            }
        });
    };

    $.sj.refTreeTableDialog.methods = {
        _create: function (target) {
            var $target = $(target).attr("componentType", "refTreeTableDialog"),
                opts = $.data(target, "refTreeTableDialog").options;

            // 3.给按钮初始化事件
            $target.off("click.ref").on("click.ref", function () {
                var opts = $target.sjRefTreeTableDialog("options"),
                    treeTableUrl = opts.treeTableUrl;

                treeTableUrl += (treeTableUrl.indexOf("?") > 0 ? "&" : "?") + "corpId=" + opts.corpId + "&businessType=" + opts.businessType;
                openDialog($.extend(true, {}, opts, {
                    treeTableUrl: treeTableUrl,
                    selectLeaf: true,
                    target: $target
                }));
            });
        },
        options: function (jq) {
            return $.data(jq[0], 'refTreeTableDialog').options;
        },
        // 打开弹出窗口
        showDialog: function (jq) {
            $(jq[0]).trigger("click.ref");
        }
    };

    $.sj.refTreeTableDialog.parseOptions = function (target) {
        return $.extend({}, {}, $.parser.parseOptions(target, [
            "corpId", "matchValue", "businessType", "treeTableUrl",
            "keyField", "multiple", "openConditon"
        ]));
    };

    $.sj.refTreeTableDialog.defaults = {
        corpId: "", //公司编号
        //matchValue: "",
        businessType: "EMPLOYEE",//required 业务类型

        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        sqlType: null,
        // 可为json对象或为返回json对象的函数
        sqlData: null,
        // 查询时额外sql类型，可以是字符串，或为返回字符串的函数
        treeSqlType: null,
        // 可为json对象或为返回json对象的函数
        treeSqlData: null,

        //当关闭对话框时调用
        afterSelect: function (selectedValue) {
        },

        //treeTableUrl: App.contextPath + "/bd/refTreeTable.htm?token=" + userInfoUtil.getToken(), //required
        treeTableUrl: App.contextPath + "/bd/refTreeTable.htm", //required
        /** 返回给后台的字段 */
        keyField: "id",
        /** 展示的字段, 备注： 可为数组或函数 */
        text: ["name"],
        multiple: true,
        openConditon: function () {
            return true;
        }
    };

    $.fn.sjRefTreeTableDialog = $.sj.refTreeTableDialog;
})(jQuery);