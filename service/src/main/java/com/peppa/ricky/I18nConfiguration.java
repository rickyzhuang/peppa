package com.peppa.ricky;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

/**
 * @author zhuangjiayin
 */
@Configuration
public class I18nConfiguration {

    /**
     * <pre>
     *      <bean id="messageSource" class="org.springframework.context.support.ResourceBundleMessageSource">
     *          <property name="basenames"><list>
     *              <value>i18n.demo</value>
     *          </list>
     *          </property><property name="defaultEncoding" value="UTF-8"/>
     *      </bean>
     *  </pre>
     *
     * @return
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.addBasenames("i18n.application",
                "i18n.demo");
        source.setDefaultEncoding("UTF-8");
        return source;
    }

}
