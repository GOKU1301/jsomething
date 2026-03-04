package com.jiit.jay_pyqs.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "pyq")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PYQ {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "subject")
    private String subject;

    @Column(name = "subject_code")
    private String subjectCode;

    @Column(name = "year")
    private Integer year;

    @Column(name = "exam_type")
    private String examType; // e.g. T1, T2, T3

    @Column(name = "questionpapers3key")
    private String questionPaperS3Key;

    @Column(name = "solutions3key")
    private String solutionS3Key;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
