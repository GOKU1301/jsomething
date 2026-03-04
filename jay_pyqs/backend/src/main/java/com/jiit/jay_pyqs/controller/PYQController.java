package com.jiit.jay_pyqs.controller;

import com.jiit.jay_pyqs.model.PYQ;
import com.jiit.jay_pyqs.service.PYQService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/pyqs")
@CrossOrigin(origins = "*") // For development
public class PYQController {

    private final PYQService pyqService;

    public PYQController(PYQService pyqService) {
        this.pyqService = pyqService;
    }

    @PostMapping("/upload")
    public ResponseEntity<PYQ> upload(
            @RequestParam("subject") String subject,
            @RequestParam("subjectCode") String subjectCode,
            @RequestParam("year") Integer year,
            @RequestParam("examType") String examType,
            @RequestParam(value = "questionPaper", required = false) MultipartFile questionPaper,
            @RequestParam(value = "solution", required = false) MultipartFile solution) {
        try {
            PYQ uploaded = pyqService.uploadPYQ(subject, subjectCode, year, examType, questionPaper, solution);
            return ResponseEntity.ok(uploaded);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<PYQ>> search(
            @RequestParam("subjectCode") String subjectCode,
            @RequestParam(value = "yearFrom") Integer yearFrom,
            @RequestParam(value = "yearTo") Integer yearTo,
            @RequestParam(value = "examTypeFrom") String examTypeFrom,
            @RequestParam(value = "examTypeTo") String examTypeTo) {
        List<PYQ> results = pyqService.searchPYQsRange(subjectCode, yearFrom, yearTo, examTypeFrom, examTypeTo);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PYQ>> getAll() {
        return ResponseEntity.ok(pyqService.getAll());
    }

    @PutMapping("/{id}/solution")
    public ResponseEntity<PYQ> updateSolution(
            @PathVariable Long id,
            @RequestParam("solution") MultipartFile solution) {
        try {
            PYQ updated = pyqService.updateSolution(id, solution);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
