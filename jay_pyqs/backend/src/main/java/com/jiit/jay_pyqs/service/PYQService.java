package com.jiit.jay_pyqs.service;

import com.jiit.jay_pyqs.model.PYQ;
import com.jiit.jay_pyqs.repository.PYQRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

@Service
public class PYQService {

    private static final Logger log = Logger.getLogger(PYQService.class.getName());
    private static final String PREDICTOR_URL = "http://localhost:3002/process-document";

    private final PYQRepository pyqRepository;
    private final S3Service s3Service;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .build();

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

        PYQ saved = pyqRepository.save(pyq);

        // ── Fire-and-forget webhook to JayPredictor ──────────────────────────────
        if (saved.getQuestionPaperS3Key() != null) {
            notifyPredictor(saved);
        }

        return saved;
    }

    /**
     * Sends a non-blocking POST to JayPredictor.
     * If the Python service is offline, the exception is caught and logged —
     * the PYQ upload always succeeds regardless.
     */
    private void notifyPredictor(PYQ pyq) {
        CompletableFuture.runAsync(() -> {
            try {
                String body = String.format(
                        "{\"pyq_id\":%d,\"s3_key\":\"%s\",\"subject_code\":\"%s\",\"year\":%d,\"exam_type\":\"%s\"}",
                        pyq.getId(),
                        pyq.getQuestionPaperS3Key(),
                        pyq.getSubjectCode(),
                        pyq.getYear(),
                        pyq.getExamType());

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(PREDICTOR_URL))
                        .version(HttpClient.Version.HTTP_1_1)
                        .header("Content-Type", "application/json")
                        .header("Connection", "close")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();

                HttpResponse<String> response = httpClient.send(
                        request, HttpResponse.BodyHandlers.ofString());
                log.info("JayPredictor notified for PYQ " + pyq.getId() + ". Status: " + response.statusCode());
            } catch (Exception e) {
                log.warning("JayPredictor notification failed (non-fatal): " + e.getMessage());
            }
        });
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
