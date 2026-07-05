package com.example.historybackup.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "history_records")
public class HistoryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(length = 512)
    private String title;

    @Column(name = "visit_time")
    private LocalDateTime visitTime;

    @Column(name = "browser", length = 50)
    private String browser;

    @Column(name = "backup_time")
    private LocalDateTime backupTime;

    public HistoryRecord() {}

    public HistoryRecord(String url, String title, LocalDateTime visitTime, String browser) {
        this.url = url;
        this.title = title;
        this.visitTime = visitTime;
        this.browser = browser;
        this.backupTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getVisitTime() { return visitTime; }
    public void setVisitTime(LocalDateTime visitTime) { this.visitTime = visitTime; }

    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }

    public LocalDateTime getBackupTime() { return backupTime; }
    public void setBackupTime(LocalDateTime backupTime) { this.backupTime = backupTime; }
}
