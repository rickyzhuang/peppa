package com.peppa.ricky;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ImportResource;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.CountDownLatch;

@SpringBootApplication(scanBasePackages = {"com.peppa.ricky", },
        exclude = org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration.class)
@ImportResource({
        "classpath:/META-INF/spring/appCtx-provider.xml",
        "classpath:/META-INF/spring/appCtx-dubbo-client.xml"
})
@EnableAsync
public class ApplicationPeppaService {

    private static Logger logger = LoggerFactory
            .getLogger(ApplicationPeppaService.class);

    public static void main(String[] args) throws InterruptedException {
        new SpringApplicationBuilder().sources(ApplicationPeppaService.class).web(false).run(args);
        logger.info("ApplicationPeppaService 启动完成！");
        System.out.println("ApplicationPeppaService 启动完成！");
        new CountDownLatch(1).await();
    }

}