package com.suin.fincoach.receipt.controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.suin.fincoach.receipt.model.vo.ReceiptDTO;
import com.suin.fincoach.receipt.service.ReceiptService;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ReceiptController {

	@Autowired
	private ReceiptService service;

	// CLOVA OCR is metered/paid — off by default (see receipt.ocr.enabled in application.properties)
	@Value("${receipt.ocr.enabled:false}")
	private boolean ocrEnabled;

	// Hard cap on real (paid) CLOVA OCR calls per day, so a bug or accidental spam can't run up a bill unnoticed
	@Value("${receipt.ocr.daily-limit:20}")
	private int dailyLimit;

	private final AtomicInteger callsToday = new AtomicInteger(0);
	private volatile LocalDate callsDate = LocalDate.now();

	private synchronized int incrementAndGetTodayCalls() {
		LocalDate today = LocalDate.now();
		if (!today.equals(callsDate)) {
			callsDate = today;
			callsToday.set(0);
		}
		return callsToday.incrementAndGet();
	}

	@PostMapping("/ocr")
	public ResponseEntity<?> api(@RequestParam("receipt") MultipartFile file){

		if (!ocrEnabled) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body(Map.of("message", "영수증 OCR 기능은 현재 비활성화되어 있습니다. 직접 입력해주세요."));
		}

		if (incrementAndGetTodayCalls() > dailyLimit) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
					.body(Map.of("message", "오늘의 영수증 OCR 호출 한도(" + dailyLimit + "회)를 초과했습니다. 직접 입력해주세요."));
		}

		ReceiptDTO result = service.processReceipt(file);

		if(result != null) {
			return ResponseEntity.ok(result);
		} else{
			return ResponseEntity.internalServerError().build();
		}

	}

}
