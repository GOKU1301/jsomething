package com.jiit.jay_pyqs.service;

import com.jiit.jay_pyqs.model.PYQ;
import com.jiit.jay_pyqs.repository.PYQRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class PYQService {

    private final PYQRepository pyqRepository;
    private final S3Service s3Service;

    public PYQService(PYQRepository pyqRepository, S3Service s3Service) {
        this.pyqRepository = pyqRepository;
        this.s3Service = s3Service;
    }

    public PYQ uploadPYQ(String subject, String subjectCode, Integer year, String examType, MultipartFile questionPaper,
            MultipartFile solution) throws IOException {
        String questionKey = null;
        String solutionKey = null;

        if (questionPaper != null && !questionPaper.isEmpty()) {
            questionKey = s3Service.uploadFile(questionPaper, "questions");
        }

        if (solution != null && !solution.isEmpty()) {
            solutionKey = s3Service.uploadFile(solution, "solutions");
        }

        PYQ pyq = PYQ.builder()
                .subject(subject)
                .subjectCode(subjectCode)
                .year(year)
                .examType(examType)
                .questionPaperS3Key(questionKey)
                .solutionS3Key(solutionKey)
                .build();

        return pyqRepository.save(pyq);
    }

    public List<PYQ> searchPYQsRange(String subjectCode, Integer yearFrom, Integer yearTo,
            String examTypeFrom, String examTypeTo) {
        if (subjectCode == null || yearFrom == null || yearTo == null
                || examTypeFrom == null || examTypeTo == null) {
            return List.of();
        }
        // Ensure yearFrom <= yearTo
        int yFrom = Math.min(yearFrom, yearTo);
        int yTo = Math.max(yearFrom, yearTo);

        // Normalise examType ordering
        List<String> order = List.of("T1", "T2", "T3");
        int fromIdx = order.indexOf(examTypeFrom.toUpperCase());
        int toIdx = order.indexOf(examTypeTo.toUpperCase());
        if (fromIdx == -1 || toIdx == -1)
            return List.of();
        String eFrom = order.get(Math.min(fromIdx, toIdx));
        String eTo = order.get(Math.max(fromIdx, toIdx));

        List<PYQ> results = pyqRepository.findBySubjectCodeAndYearRangeAndExamTypeRange(
                subjectCode, yFrom, yTo, eFrom, eTo);
        return results.stream().map(this::resolveUrls).toList();
    }

    private PYQ resolveUrls(PYQ pyq) {
        if (pyq.getQuestionPaperS3Key() != null) {
            pyq.setQuestionPaperS3Key(s3Service.getFileUrl(pyq.getQuestionPaperS3Key()));
        }
        if (pyq.getSolutionS3Key() != null) {
            pyq.setSolutionS3Key(s3Service.getFileUrl(pyq.getSolutionS3Key()));
        }
        return pyq;
    }

    public PYQ updateSolution(Long id, MultipartFile solution) throws IOException {
        Optional<PYQ> existing = pyqRepository.findById(id);
        if (existing.isPresent()) {
            PYQ pyq = existing.get();
            String solutionKey = s3Service.uploadFile(solution, "solutions");
            pyq.setSolutionS3Key(solutionKey);
            return pyqRepository.save(pyq);
        }
        throw new RuntimeException("PYQ not found");
    }

    public List<PYQ> getAll() {
        return pyqRepository.findAll().stream().map(this::resolveUrls).toList();
    }
}
