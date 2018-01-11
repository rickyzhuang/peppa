package com.peppa.ricky.web;
import com.peppa.ricky.base.BaseController;
import com.peppa.ricky.exception.BusinessException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Describetion
 * Created  by  zhuangjiayin
 * Date : 2018/1/10
 */
@Controller
@RequestMapping("/user")
public class UserController extends BaseController{



    @RequestMapping("/index.htm")
    public String index(Model model,String userId){
        logger.info("进入用户首页失败--index.htm：userId->{}", userId);
        try {
            model.addAttribute("userId",userId);
            return "/user/index";
        } catch (BusinessException e) {
            logger.error("index.htm business  error:{}-->[userId]={}", e.getMessage(), userId, e);
            return errorJsp(model, e);
        } catch (Exception e) {
            logger.error("index.htm error:{}-->[userId]={}", e.getMessage(), userId, e);
            return errorJsp(model, e);
        }
    }

    private String errorJsp(Model model, Exception e) {
        model.addAttribute("exception", e);
        return  "error";
//        return "redirect:/error/index.htm";
    }
}
