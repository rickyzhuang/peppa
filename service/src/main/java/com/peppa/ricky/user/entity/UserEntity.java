package com.peppa.ricky.user.entity;

import com.peppa.ricky.base.BaseEntity;
import java.io.Serializable;

public class UserEntity extends BaseEntity implements Serializable {
    private String id;

    private String name;

    private Integer age;

    private static final long serialVersionUID = 1L;

    public UserEntity(String id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Integer getAge() {
        return age;
    }
}