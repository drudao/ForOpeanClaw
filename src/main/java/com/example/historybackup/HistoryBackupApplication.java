package com.example.historybackup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HistoryBackupApplication {

    public static void main(String[] args) {
        SpringApplication.run(HistoryBackupApplication.class, args);
    }
}
