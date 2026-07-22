import { createContext, useCallback, useContext, useState } from "react";

const AppReadyContext = createContext({ ready: false, markReady: () => {} });

// 스플래시가 "메인 화면 데이터가 실제로 준비됐는지"를 알 수 있게 해주는 신호.
// 로그인 필요 없는 페이지(로그인/온보딩)는 마운트 즉시, 홈(MyPage)은 초기 데이터
// 로딩이 끝난 뒤 markReady()를 호출한다. 그 외 딥링크로 들어온 페이지는 아무도
// 호출하지 않을 수 있으므로, SplashScreen 쪽에 별도의 최대 대기 시간 안전장치가 있다.
export const AppReadyProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  return (
    <AppReadyContext.Provider value={{ ready, markReady }}>
      {children}
    </AppReadyContext.Provider>
  );
};

export const useAppReady = () => useContext(AppReadyContext);
