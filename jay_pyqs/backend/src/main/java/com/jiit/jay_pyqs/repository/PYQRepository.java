package com.jiit.jay_pyqs.repository;

import com.jiit.jay_pyqs.model.PYQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PYQRepository extends JpaRepository<PYQ, Long> {

    List<PYQ> findBySubjectCodeIgnoreCaseAndYearAndExamType(String subjectCode, Integer year, String examType);

    /**
     * Range-based search: year between yearFrom and yearTo,
     * and exam type between examTypeFrom and examTypeTo (T1 < T2 < T3).
     */
    @Query("SELECT p FROM PYQ p WHERE LOWER(p.subjectCode) = LOWER(:subjectCode) " +
           "AND p.year BETWEEN :yearFrom AND :yearTo " +
           "AND (CASE p.examType WHEN 'T1' THEN 1 WHEN 'T2' THEN 2 WHEN 'T3' THEN 3 ELSE 0 END) " +
           "BETWEEN (CASE :examTypeFrom WHEN 'T1' THEN 1 WHEN 'T2' THEN 2 WHEN 'T3' THEN 3 ELSE 0 END) " +
           "AND (CASE :examTypeTo WHEN 'T1' THEN 1 WHEN 'T2' THEN 2 WHEN 'T3' THEN 3 ELSE 0 END) " +
           "ORDER BY p.year, p.examType")
    List<PYQ> findBySubjectCodeAndYearRangeAndExamTypeRange(
            @Param("subjectCode") String subjectCode,
            @Param("yearFrom") Integer yearFrom,
            @Param("yearTo") Integer yearTo,
            @Param("examTypeFrom") String examTypeFrom,
            @Param("examTypeTo") String examTypeTo);
}
