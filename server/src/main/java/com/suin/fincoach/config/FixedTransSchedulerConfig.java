package com.suin.fincoach.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.suin.fincoach.trans.service.TransServiceImpl;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FixedTransSchedulerConfig {

  private final TransServiceImpl transService;

  // 매일 00:05 실행
  @Scheduled(cron = "0 5 0 * * *")
  public void runDailyFixedTransToMyTrans() {
    transService.mergeFixedToMyTrans();
  }
}

