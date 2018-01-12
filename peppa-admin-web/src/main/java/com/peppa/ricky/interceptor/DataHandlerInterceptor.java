package com.peppa.ricky.interceptor;

//import javax.servlet.http.HttpServletRequest;
//import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

public class DataHandlerInterceptor extends HandlerInterceptorAdapter {
    Logger logger = LoggerFactory.getLogger(DataHandlerInterceptor.class);

  /*  public DataHandlerInterceptor() {
    }

    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        return true;
    }

    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (ex != null) {
            this.logger.error("request error.", ex);
        }

    }*/
}
