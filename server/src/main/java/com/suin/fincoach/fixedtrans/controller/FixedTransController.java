package com.suin.fincoach.fixedtrans.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.suin.fincoach.fixedtrans.model.dto.request.FixedTransCreateRequest;
import com.suin.fincoach.fixedtrans.model.dto.request.FixedTransUpdateRequest;
import com.suin.fincoach.fixedtrans.model.vo.FixedTrans;
import com.suin.fincoach.fixedtrans.service.FixedTransService;
import com.suin.fincoach.util.JwtUtil;

@RestController
@RequestMapping("/fixedtrans")
public class FixedTransController {
	
	@Autowired
	private JwtUtil jwtUtil;
	
	@Autowired
	private FixedTransService service; 
	
	// 고정 지출 내역 갖고오기 
	@GetMapping
	public ResponseEntity<?> getFixedList(@RequestParam int userId) {
		
		List<FixedTrans> fixedList = service.getFixedList(userId);
		
		if(fixedList != null) {
			return ResponseEntity.ok(fixedList); 
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("등록된 고정 지출 내역이 없습니다.");
		}
			
	}
	
	// 고정 지출 등록 
	@PostMapping("/register")
	public ResponseEntity<?> create(@RequestBody FixedTransCreateRequest req) {
		
		int result = service.create(req);
		
		if(result > 0) {
			return ResponseEntity.ok("고정 지출이 등록됐습니다."); 
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버에 에러가 발생하여 고정 지출 등록을 실패했습니다.");
		}
		
	}
	
	//고정 지출 삭제
	@DeleteMapping("/{fixedId}")
	public ResponseEntity<?> deleteFixedExpense(@PathVariable int fixedId) {
		
		int result = service.deleteFixedExpense(fixedId);
		
		if(result > 0) {
			return ResponseEntity.ok("고정 지출 내역을 삭제했습니다.");
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버에 에러가 발생하여 고정 지출 내역 삭제를 실패했습니다.");
		}

	}
	
	
	//고정 지출 수정하기
	@PatchMapping("/update")
	public ResponseEntity<?> updateFixedExpense(@RequestBody FixedTransUpdateRequest req) {
		
		int result = service.updateFixedExpense(req);
		
		if(result > 0) {
			return ResponseEntity.ok("고정 지출 내역을 수정했습니다.");
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버에 에러가 발생하여 수정하지 못했습니다."); 
		}
		
	}
	
	
	
	
	
	
	

}
