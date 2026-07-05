package com.example.historybackup.service;

import com.example.historybackup.model.HistoryRecord;

import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 从 Chrome 浏览器 SQLite 历史记录文件中读取数据
 */
@Service
public class ChromeHistoryReader {

    private static final Logger log = LoggerFactory.getLogger(ChromeHistoryReader.class);

    /** Chrome 历史记录文件路径 */
    private static final String CHROME_HISTORY_PATH =
        System.getenv("LOCALAPPDATA") + "\\Google\\Chrome\\User Data\\Default\\History";

    /**
     * 读取 Chrome 历史记录
     * @param limit 限制读取条数（null 或无限制则不限制）
     * @return 历史记录列表
     */
    public List<HistoryRecord> readChromeHistory(Integer limit) {
        File historyFile = new File(CHROME_HISTORY_PATH);
        if (!historyFile.exists()) {
            log.warn("Chrome 历史记录文件不存在: {}", CHROME_HISTORY_PATH);
            return Collections.emptyList();
        }

        // 复制一份，因为 Chrome 运行时锁定了数据库文件
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("chrome_history_", ".sqlite");
            Files.copy(historyFile.toPath(), tempFile, StandardCopyOption.REPLACE_EXISTING);
            return readFromFile(tempFile.toFile(), limit);
        } catch (IOException e) {
            log.error("复制历史记录文件失败", e);
            return Collections.emptyList();
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
        }
    }

    private List<HistoryRecord> readFromFile(File dbFile, Integer limit) {
        List<HistoryRecord> records = new ArrayList<>();
        String url = "jdbc:sqlite:" + dbFile.getAbsolutePath();

        String sql = "SELECT urls.url, urls.title, urls.last_visit_time FROM urls " +
                     "ORDER BY urls.last_visit_time DESC";
        if (limit != null && limit > 0) {
            sql += " LIMIT " + limit;
        }

        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                String pageUrl = rs.getString("url");
                String title = rs.getString("title");
                if (title == null || title.isBlank()) {
                    title = pageUrl;
                }
                long chromeTime = rs.getLong("last_visit_time");
                LocalDateTime visitTime = chromeTimeToLocalDateTime(chromeTime);

                records.add(new HistoryRecord(pageUrl, title, visitTime, "Chrome"));
            }

            log.info("从 Chrome 历史记录中读取了 {} 条记录", records.size());
        } catch (SQLException e) {
            log.error("读取 SQLite 数据库失败", e);
        }

        return records;
    }

    /**
     * Chrome 时间戳（1601-01-01 以来的微秒数）转 LocalDateTime
     */
    private LocalDateTime chromeTimeToLocalDateTime(long chromeTime) {
        // Chrome 时间戳起点: 1601-01-01 00:00:00 UTC
        long epochMicros = (chromeTime - 11644473600000000L) * 10;
        long epochMillis = epochMicros / 1000;
        return LocalDateTime.ofEpochSecond(epochMillis / 1000, 0, ZoneOffset.UTC);
    }
}
