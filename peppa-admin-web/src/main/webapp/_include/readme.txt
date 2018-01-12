嵌入页面的依赖关系(首数字为依赖的级别编号)

1._html_doctype.jsp
	.不依赖
	.引入方式
		<%@ include file="/views/include/_html_doctype.jsp"%>
	.位置
		在标签<html>之前

1._jsp_tags.jsp
	.不依赖
	.引入方式
		<%@ include file="/views/include/_jsp_tags.jsp"%>
	.位置
		在标签<html>之前
	
2._jsp_variable.jsp
	.依赖
		_jsp_tags.jsp
	.引入方式
		<%@ include file="/views/include/_jsp_variable.jsp"%>
	.位置
		在标签<html>之前

1._html_meta.jsp
	.不依赖
	.引入方式
		<%@ include file="/views/include/_html_meta.jsp"%>
	.位置
		在标签<head>之后
		
2._js_variable.jsp
	.依赖
		_jsp_variable.jsp
	.引入方式
		<%@include file="/views/include/_js_variable.jsp"%>
	.位置
		在标签<title>...</title>【即_meta.jsp】之后

1._html_link_shortcuticon.jsp
	.不依赖
	.引入方式
		<%@include file="/views/include/_html_link_shortcuticon.jsp"%>
	.位置
		在标签</head>之前
		
1._html_title.jsp
	.不依赖
	.引入方式
		<%@include file="/views/include/_html_title.jsp"%>
	.位置
		在标签</head>之前
