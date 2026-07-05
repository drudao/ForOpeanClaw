package com.example.historybackup.repository;

import com.example.historybackup.model.HistoryRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface HistoryRecordRepository extends JpaRepository<HistoryRecord, Long> {

    @Query("SELECT h FROM HistoryRecord h WHERE " +
           "(:keyword IS NULL OR h.title LIKE %:keyword% OR h.url LIKE %:keyword%) AND " +
           "(:startDate IS NULL OR h.visitTime >= :startDate) AND " +
           "(:endDate IS NULL OR h.visitTime <= :endDate) " +
           "ORDER BY h.visitTime DESC")
    Page<HistoryRecord> searchHistory(
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    boolean existsByUrlAndVisitTime(String url, LocalDateTime visitTime);
}
