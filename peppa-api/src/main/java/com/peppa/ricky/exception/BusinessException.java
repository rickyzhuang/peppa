package com.peppa.ricky.exception;

/**
 * Describetion
 * Created  by  zhuangjiayin
 * Date : 2018/1/10
 */
public class BusinessException extends RuntimeException {
    private String code;
    private static final long serialVersionUID = 1326759065188132105L;

    public void setCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return this.code;
    }

    public BusinessException() {
    }

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }

    public BusinessException(String message, Throwable cause, String code) {
        super(message, cause);
        this.code = code;
    }

    public BusinessException(Throwable cause) {
        super(cause);
    }
}