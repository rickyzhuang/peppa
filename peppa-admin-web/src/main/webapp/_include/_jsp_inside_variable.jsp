<%@ page import="com.onlyou.framework.spring.beans.factory.config.PropertyPlaceholderConfigurer" %>
<script type="text/javascript">
    var Globe = {}
    Globe.baseDomain = "${`}";
    Globe.staticContextPath = Globe.baseDomain + "/assets/js/application/yqb/";
    Globe.gridPath = "${contextPath}/";
    Globe.resourcepath = "${uploadHttpPath}/";
    Globe.jsDebug =${jsDebug};
    Globe.language = "${language}";
    Globe.staticResourceVersion = ("${staticResourceVersion}" ? "${staticResourceVersion}" : 1)
</script>