package com.example.historybackup.service;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.repository.HistoryRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HistoryService {

    private static final Logger log = LoggerFactory.getLogger(HistoryService.class);

    private final HistoryRecordRepository repository;
    private final ChromeHistoryReader chromeReader;

    public HistoryService(HistoryRecordRepository repository, ChromeHistoryReader chromeReader) {
        this.repository = repository;
        this.chromeReader = chromeReader;
    }

    /**
     * 定时备份：每天 10:00 和 22:00 自动备份
     */
    @Scheduled(cron = "0 0 10,22 * * ?")
    public void scheduledBackup() {
        log.info("执行定时备份任务...");
        backupChromeHistory();
    }

    /**
     * 手动触发备份
     */
    public int backupChromeHistory() {
        List<HistoryRecord> records = chromeReader.readChromeHistory(1000);
        int imported = 0;

        for (HistoryRecord record : records) {
            if (!repository.existsByUrlAndVisitTime(record.getUrl(), record.getVisitTime())) {
                repository.save(record);
                imported++;
            }
        }

        log.info("备份完成：共读取 {} 条，新增导入 {} 条", records.size(), imported);
        return imported;
    }

    /**
     * 搜索历史记录
     */
    public Page<HistoryRecord> searchHistory(String keyword, LocalDateTime startDate,
                                              LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.searchHistory(keyword, startDate, endDate, pageable);
    }

    /**
     * 删除单条记录
     */
    public boolean deleteRecord(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * 获取总记录数
     */
    public long getTotalCount() {
        return repository.count();
    }
}
